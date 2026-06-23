import ExcelJS from "exceljs";
import { NextResponse } from "next/server";

import { getAdminUserForRoute } from "@/lib/auth";
import { STATUS_LABELS } from "@/lib/constants";
import {
  formatDateTime,
  getAdminDateKey,
  shortenId,
} from "@/lib/formatters";
import {
  parseSubmissionFilters,
  toSubmissionQueryFilters,
} from "@/lib/submission-filters";
import { listSubmissionFiles, listSubmissions } from "@/lib/submissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const statusFillMap: Record<string, string> = {
  new: "FFFDE68A",
  in_review: "FFBAE6FD",
  resolved: "FFBBF7D0",
};

function applyCellFill(cell: ExcelJS.Cell, argb: string) {
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb },
  };
}

function styleHeaderRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = {
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    applyCellFill(cell, "FF133B6C");
    cell.border = {
      top: { style: "thin", color: { argb: "FFD8E0EB" } },
      left: { style: "thin", color: { argb: "FFD8E0EB" } },
      bottom: { style: "thin", color: { argb: "FFD8E0EB" } },
      right: { style: "thin", color: { argb: "FFD8E0EB" } },
    };
  });
}

function applyBoxBorder(
  worksheet: ExcelJS.Worksheet,
  startRow: number,
  endRow: number,
  startCol: number,
  endCol: number,
) {
  for (let rowIndex = startRow; rowIndex <= endRow; rowIndex += 1) {
    for (let colIndex = startCol; colIndex <= endCol; colIndex += 1) {
      const cell = worksheet.getCell(rowIndex, colIndex);

      cell.border = {
        top:
          rowIndex === startRow
            ? { style: "thin", color: { argb: "FFD8E0EB" } }
            : undefined,
        left:
          colIndex === startCol
            ? { style: "thin", color: { argb: "FFD8E0EB" } }
            : undefined,
        bottom:
          rowIndex === endRow
            ? { style: "thin", color: { argb: "FFD8E0EB" } }
            : undefined,
        right:
          colIndex === endCol
            ? { style: "thin", color: { argb: "FFD8E0EB" } }
            : undefined,
      };
    }
  }
}

function styleHyperlinkCell(cell: ExcelJS.Cell) {
  cell.font = {
    color: { argb: "FF2563EB" },
    underline: true,
  };
}

function styleDataRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.border = {
      bottom: { style: "thin", color: { argb: "FFF1F5F9" } },
    };
    cell.alignment = {
      vertical: "top",
      wrapText: true,
    };
  });
}

export async function GET(request: Request) {
  const user = await getAdminUserForRoute();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const url = new URL(request.url);
  const filters = parseSubmissionFilters({
    search: url.searchParams.get("search") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    dateFrom: url.searchParams.get("dateFrom") ?? undefined,
    dateTo: url.searchParams.get("dateTo") ?? undefined,
  });

  const submissions = await listSubmissions(toSubmissionQueryFilters(filters));
  const submissionFiles = await listSubmissionFiles(
    submissions.map((submission) => submission.id),
  );
  const requestOrigin = url.origin;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Codex";
  workbook.company = "CREE";
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.title = "Reporte de solicitudes";
  workbook.subject = "Solicitudes ingresadas";

  const summarySheet = workbook.addWorksheet("Resumen", {
    views: [{ showGridLines: false }],
  });
  const dataSheet = workbook.addWorksheet("Solicitudes", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  const filesSheet = workbook.addWorksheet("Archivos", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  summarySheet.mergeCells("A1:E1");
  summarySheet.getCell("A1").value = "Reporte de solicitudes ingresadas";
  summarySheet.getCell("A1").font = {
    size: 16,
    bold: true,
    color: { argb: "FF10223A" },
  };

  summarySheet.getCell("A3").value = "Generado el";
  summarySheet.getCell("B3").value = formatDateTime(new Date().toISOString());
  summarySheet.getCell("A4").value = "Generado por";
  summarySheet.getCell("B4").value = user.email ?? "Administrador";
  summarySheet.getCell("A5").value = "Busqueda";
  summarySheet.getCell("B5").value = filters.search || "Todas";
  summarySheet.getCell("A6").value = "Estado";
  summarySheet.getCell("B6").value =
    filters.status === "all" ? "Todos" : STATUS_LABELS[filters.status];
  summarySheet.getCell("A7").value = "Fecha desde";
  summarySheet.getCell("B7").value = filters.dateFrom || "Sin limite";
  summarySheet.getCell("A8").value = "Fecha hasta";
  summarySheet.getCell("B8").value = filters.dateTo || "Sin limite";
  summarySheet.getCell("A9").value = "Enlaces";
  summarySheet.getCell("B9").value =
    "El libro incluye enlaces al panel y a la descarga autenticada de cada archivo.";

  summarySheet.getCell("D3").value = "Total filtradas";
  summarySheet.getCell("E3").value = submissions.length;
  summarySheet.getCell("D4").value = "Nuevas";
  summarySheet.getCell("E4").value = submissions.filter(
    (submission) => submission.status === "new",
  ).length;
  summarySheet.getCell("D5").value = "En revision";
  summarySheet.getCell("E5").value = submissions.filter(
    (submission) => submission.status === "in_review",
  ).length;
  summarySheet.getCell("D6").value = "Resueltas";
  summarySheet.getCell("E6").value = submissions.filter(
    (submission) => submission.status === "resolved",
  ).length;

  summarySheet.getColumn("A").width = 20;
  summarySheet.getColumn("B").width = 54;
  summarySheet.getColumn("D").width = 18;
  summarySheet.getColumn("E").width = 14;
  summarySheet.getCell("B9").alignment = {
    vertical: "top",
    wrapText: true,
  };

  for (const rowNumber of [3, 4, 5, 6, 7, 8, 9]) {
    summarySheet.getCell(`A${rowNumber}`).font = { bold: true };
  }

  for (const rowNumber of [3, 4, 5, 6]) {
    summarySheet.getCell(`D${rowNumber}`).font = { bold: true };
  }

  applyBoxBorder(summarySheet, 3, 9, 1, 2);
  applyBoxBorder(summarySheet, 3, 6, 4, 5);

  summarySheet.getRow(3).eachCell((cell, colNumber) => {
    if (colNumber >= 4 && colNumber <= 5) {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      applyCellFill(cell, "FF133B6C");
    }
  });

  dataSheet.columns = [
    { header: "Solicitud", key: "requestCode", width: 16 },
    { header: "ID completo", key: "id", width: 38 },
    { header: "Fecha de ingreso", key: "createdAt", width: 22 },
    { header: "Estado", key: "status", width: 16 },
    { header: "Nombre completo", key: "fullName", width: 34 },
    { header: "Codigo cliente", key: "clientCode", width: 18 },
    { header: "Telefono", key: "phone", width: 20 },
    { header: "Correo", key: "email", width: 28 },
    { header: "Imagenes", key: "filesCount", width: 12 },
    { header: "Ultima actualizacion", key: "updatedAt", width: 22 },
    { header: "Notas internas", key: "notes", width: 40 },
    { header: "Detalle en panel", key: "detailLink", width: 24 },
  ];

  styleHeaderRow(dataSheet.getRow(1));
  dataSheet.autoFilter = {
    from: "A1",
    to: "L1",
  };

  filesSheet.columns = [
    { header: "Solicitud", key: "requestCode", width: 16 },
    { header: "ID completo", key: "submissionId", width: 38 },
    { header: "Nombre completo", key: "fullName", width: 30 },
    { header: "Archivo", key: "fileName", width: 34 },
    { header: "Tipo", key: "contentType", width: 20 },
    { header: "Peso (bytes)", key: "sizeBytes", width: 16 },
    { header: "Orden", key: "sortOrder", width: 12 },
    { header: "Descarga", key: "downloadLink", width: 24 },
    { header: "Detalle solicitud", key: "detailLink", width: 24 },
  ];

  styleHeaderRow(filesSheet.getRow(1));
  filesSheet.autoFilter = {
    from: "A1",
    to: "I1",
  };

  const requestCodeBySubmissionId = new Map(
    submissions.map((submission) => [submission.id, shortenId(submission.id)]),
  );
  const fullNameBySubmissionId = new Map(
    submissions.map((submission) => [submission.id, submission.full_name]),
  );

  submissions.forEach((submission) => {
    const detailUrl = `${requestOrigin}/admin/submissions/${submission.id}`;
    const row = dataSheet.addRow({
      requestCode: shortenId(submission.id),
      id: submission.id,
      createdAt: new Date(submission.created_at),
      status: STATUS_LABELS[submission.status],
      fullName: submission.full_name,
      clientCode: submission.client_code,
      phone: submission.phone || "Sin telefono",
      email: submission.email || "Sin correo",
      filesCount: submission.files_count,
      updatedAt: new Date(submission.updated_at),
      notes: submission.notes || "",
      detailLink: {
        text: "Abrir solicitud",
        hyperlink: detailUrl,
        tooltip: "Abrir detalle de la solicitud en el panel.",
      },
    });

    row.getCell("createdAt").numFmt = "yyyy-mm-dd hh:mm";
    row.getCell("updatedAt").numFmt = "yyyy-mm-dd hh:mm";
    row.getCell("filesCount").alignment = { horizontal: "center" };
    row.getCell("status").alignment = { horizontal: "center" };

    applyCellFill(
      row.getCell("status"),
      statusFillMap[submission.status] ?? "FFE2E8F0",
    );

    styleDataRow(row);
    styleHyperlinkCell(row.getCell("detailLink"));
  });

  submissionFiles.forEach((file) => {
    const detailUrl = `${requestOrigin}/admin/submissions/${file.submission_id}`;
    const downloadUrl = `${requestOrigin}/api/admin/files/${file.id}`;
    const row = filesSheet.addRow({
      requestCode: requestCodeBySubmissionId.get(file.submission_id) ?? "",
      submissionId: file.submission_id,
      fullName: fullNameBySubmissionId.get(file.submission_id) ?? "",
      fileName: file.file_name,
      contentType: file.content_type,
      sizeBytes: file.size_bytes,
      sortOrder: file.sort_order + 1,
      downloadLink: {
        text: "Descargar archivo",
        hyperlink: downloadUrl,
        tooltip: "Descarga autenticada del archivo.",
      },
      detailLink: {
        text: "Abrir solicitud",
        hyperlink: detailUrl,
        tooltip: "Abrir detalle de la solicitud en el panel.",
      },
    });

    row.getCell("sizeBytes").numFmt = "#,##0";
    row.getCell("sortOrder").alignment = { horizontal: "center" };

    styleDataRow(row);
    styleHyperlinkCell(row.getCell("downloadLink"));
    styleHyperlinkCell(row.getCell("detailLink"));
  });

  if (!submissions.length) {
    dataSheet.addRow({
      requestCode: "Sin resultados",
      fullName: "No existen solicitudes para los filtros aplicados.",
    });
  }

  if (!submissionFiles.length) {
    filesSheet.addRow({
      requestCode: "Sin archivos",
      fileName: "No existen archivos para los filtros aplicados.",
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = `reporte-solicitudes-${getAdminDateKey(new Date())}.xlsx`;

  return new NextResponse(Buffer.from(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
