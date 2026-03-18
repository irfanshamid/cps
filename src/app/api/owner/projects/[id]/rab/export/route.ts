import { NextRequest, NextResponse } from "next/server"
import ExcelJS from "exceljs"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@prisma/client"

export const runtime = "nodejs"

type UnifiedItem = {
  source: "RAB" | "CASHFLOW"
  name: string
  description: string | null
  category: string
  quantity: number | null
  unit: string | null
  unitPriceRAB: number | null
  budgetRAB: number
  unitPriceReal: number | null
  budgetReal: number
  createdAt: Date
}

const DEFAULT_CATEGORIES = [
  "Pekerjaan Persiapan",
  "Pekerjaan Struktur",
  "Pekerjaan Arsitektur",
  "Pekerjaan ME / MEP",
  "Pekerjaan Finishing",
  "Lainnya",
]

function sanitizeFilenamePart(value: string) {
  return value.replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim()
}

function formatDateYYYYMMDD(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}${m}${d}`
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await context.params
  const session = await getSession()

  if (
    !session ||
    !session.user ||
    session.user.role !== UserRole.OWNER ||
    !session.user.ownerId
  ) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: session.user.ownerId,
    },
  })

  if (!project) {
    return NextResponse.json({ message: "Project not found" }, { status: 404 })
  }

  const [rabs, cashflows] = await Promise.all([
    prisma.rAB.findMany({
      where: {
        projectId: project.id,
        ownerId: session.user.ownerId,
      },
      orderBy: [{ category: "asc" }, { createdAt: "asc" }],
    }),
    prisma.cashflow.findMany({
      where: {
        projectId: project.id,
        ownerId: session.user.ownerId,
        type: "OUT",
      },
      orderBy: { createdAt: "asc" },
    }),
  ])

  const items: UnifiedItem[] = [
    ...rabs.map((r) => ({
      source: "RAB" as const,
      name: r.name,
      description: r.description,
      category: r.category || "Tanpa Kategori",
      quantity: r.quantity ? Number(r.quantity) : null,
      unit: r.unit,
      unitPriceRAB: r.unitPrice ? Number(r.unitPrice) : null,
      budgetRAB: Number(r.budget),
      unitPriceReal: r.realUnitPrice ? Number(r.realUnitPrice) : null,
      budgetReal: r.spent
        ? Number(r.spent)
        : r.quantity && r.realUnitPrice
          ? Number(r.quantity) * Number(r.realUnitPrice)
          : 0,
      createdAt: r.createdAt,
    })),
    ...cashflows.map((c) => ({
      source: "CASHFLOW" as const,
      name: c.description || "Pengeluaran Cashflow",
      description: null,
      category: c.category || "Tanpa Kategori",
      quantity: c.quantity ? Number(c.quantity) : null,
      unit: c.unit,
      unitPriceRAB: c.unitPrice ? Number(c.unitPrice) : null,
      budgetRAB: c.budget ? Number(c.budget) : 0,
      unitPriceReal:
        c.quantity && Number(c.quantity) > 0
          ? Number(c.amount) / Number(c.quantity)
          : null,
      budgetReal: Number(c.amount),
      createdAt: c.createdAt,
    })),
  ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

  const groups = items.reduce<Record<string, { items: UnifiedItem[]; totalBudgetRAB: number; totalBudgetReal: number }>>(
    (acc, item) => {
      const key = item.category
      if (!acc[key]) {
        acc[key] = { items: [], totalBudgetRAB: 0, totalBudgetReal: 0 }
      }
      acc[key].items.push(item)
      acc[key].totalBudgetRAB += item.budgetRAB || 0
      acc[key].totalBudgetReal += item.budgetReal || 0
      return acc
    },
    {}
  )

  const orderedCategories = Object.keys(groups).sort((a, b) => {
    const ia = DEFAULT_CATEGORIES.indexOf(a)
    const ib = DEFAULT_CATEGORIES.indexOf(b)
    if (ia !== -1 || ib !== -1) {
      if (ia === -1) return 1
      if (ib === -1) return -1
      return ia - ib
    }
    return a.localeCompare(b)
  })

  const grand = orderedCategories.reduce(
    (acc, category) => {
      acc.totalBudgetRAB += groups[category]?.totalBudgetRAB ?? 0
      acc.totalBudgetReal += groups[category]?.totalBudgetReal ?? 0
      return acc
    },
    { totalBudgetRAB: 0, totalBudgetReal: 0 }
  )

  const workbook = new ExcelJS.Workbook()
  workbook.creator = "Blueprint"
  workbook.created = new Date()

  const sheet = workbook.addWorksheet("RAB", {
    views: [{ state: "frozen", ySplit: 4 }],
    pageSetup: {
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
  })

  sheet.columns = [
    { header: "No", key: "no", width: 6 },
    { header: "Item", key: "item", width: 42 },
    { header: "Qty", key: "qty", width: 10 },
    { header: "Unit", key: "unit", width: 10 },
    { header: "Harga Satuan (RAB)", key: "unitPriceRab", width: 18 },
    { header: "Total Budget (RAB)", key: "budgetRab", width: 20 },
    { header: "Harga Satuan (Real)", key: "unitPriceReal", width: 18 },
    { header: "Total Realisasi", key: "budgetReal", width: 20 },
    { header: "Sumber", key: "source", width: 12 },
  ]

  sheet.mergeCells(1, 1, 1, 9)
  const titleCell = sheet.getCell(1, 1)
  titleCell.value = "Draft RAB & Realisasi"
  titleCell.font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } }
  titleCell.alignment = { vertical: "middle", horizontal: "center" }
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } }
  sheet.getRow(1).height = 26

  sheet.mergeCells(2, 1, 2, 9)
  const subtitleCell = sheet.getCell(2, 1)
  subtitleCell.value = `${project.name} • ${new Date().toLocaleDateString("id-ID")}`
  subtitleCell.font = { bold: true, size: 11, color: { argb: "FF0F172A" } }
  subtitleCell.alignment = { vertical: "middle", horizontal: "center" }
  subtitleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } }
  sheet.getRow(2).height = 20

  sheet.mergeCells(3, 1, 3, 9)
  const metaCell = sheet.getCell(3, 1)
  metaCell.value = "Format: nilai dalam Rupiah (Rp)"
  metaCell.font = { italic: true, size: 10, color: { argb: "FF334155" } }
  metaCell.alignment = { vertical: "middle", horizontal: "center" }

  const headerRowNumber = 4
  const headerRow = sheet.getRow(headerRowNumber)
  headerRow.values = [
    "No",
    "Item",
    "Qty",
    "Unit",
    "Harga Satuan (RAB)",
    "Total Budget (RAB)",
    "Harga Satuan (Real)",
    "Total Realisasi",
    "Sumber",
  ]
  headerRow.height = 20
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1D4ED8" } }
    cell.border = {
      top: { style: "thin", color: { argb: "FFCBD5E1" } },
      left: { style: "thin", color: { argb: "FFCBD5E1" } },
      bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
      right: { style: "thin", color: { argb: "FFCBD5E1" } },
    }
  })

  const currencyKeys = new Set(["unitPriceRab", "budgetRab", "unitPriceReal", "budgetReal"])
  const rightAlignKeys = new Set(["qty", ...Array.from(currencyKeys)])

  let rowPointer = headerRowNumber + 1
  let runningNo = 1

  const applyRowBorder = (row: ExcelJS.Row) => {
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      }
    })
  }

  for (const category of orderedCategories) {
    const categoryRow = sheet.getRow(rowPointer++)
    categoryRow.getCell(1).value = category
    sheet.mergeCells(categoryRow.number, 1, categoryRow.number, 9)
    const catCell = categoryRow.getCell(1)
    catCell.font = { bold: true, size: 11, color: { argb: "FF0F172A" } }
    catCell.alignment = { vertical: "middle", horizontal: "left" }
    catCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFF6FF" } }
    applyRowBorder(categoryRow)

    const group = groups[category]
    for (const item of group.items) {
      const row = sheet.getRow(rowPointer++)
      row.getCell(1).value = runningNo++
      row.getCell(2).value = item.name
      row.getCell(3).value = item.quantity ?? null
      row.getCell(4).value = item.unit ?? null
      row.getCell(5).value = item.unitPriceRAB ?? null
      row.getCell(6).value = item.budgetRAB ?? 0
      row.getCell(7).value = item.unitPriceReal ?? null
      row.getCell(8).value = item.budgetReal ?? 0
      row.getCell(9).value = item.source === "CASHFLOW" ? "Cashflow" : "RAB"

      row.getCell(2).alignment = { vertical: "top", horizontal: "left", wrapText: true }
      for (let c = 1; c <= 9; c++) {
        row.getCell(c).alignment = row.getCell(c).alignment ?? { vertical: "top" }
      }

      ;[
        { col: 3, key: "qty" },
        { col: 5, key: "unitPriceRab" },
        { col: 6, key: "budgetRab" },
        { col: 7, key: "unitPriceReal" },
        { col: 8, key: "budgetReal" },
      ].forEach(({ col, key }) => {
        const cell = row.getCell(col)
        if (rightAlignKeys.has(key)) {
          cell.alignment = { vertical: "top", horizontal: "right" }
        }
        if (currencyKeys.has(key)) {
          cell.numFmt = '"Rp" #,##0'
        }
      })

      applyRowBorder(row)
    }

    const subtotalRow = sheet.getRow(rowPointer++)
    sheet.mergeCells(subtotalRow.number, 1, subtotalRow.number, 5)
    const subtotalLabel = subtotalRow.getCell(1)
    subtotalLabel.value = `Total ${category}`
    subtotalLabel.font = { bold: true, color: { argb: "FF0F172A" } }
    subtotalLabel.alignment = { vertical: "middle", horizontal: "right" }

    subtotalRow.getCell(6).value = group.totalBudgetRAB
    subtotalRow.getCell(6).numFmt = '"Rp" #,##0'
    subtotalRow.getCell(6).font = { bold: true }
    subtotalRow.getCell(6).alignment = { vertical: "middle", horizontal: "right" }

    subtotalRow.getCell(7).value = null
    subtotalRow.getCell(8).value = group.totalBudgetReal
    subtotalRow.getCell(8).numFmt = '"Rp" #,##0'
    subtotalRow.getCell(8).font = { bold: true }
    subtotalRow.getCell(8).alignment = { vertical: "middle", horizontal: "right" }

    for (let c = 1; c <= 9; c++) {
      const cell = subtotalRow.getCell(c)
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFBEB" } }
    }
    applyRowBorder(subtotalRow)
  }

  const grandRow = sheet.getRow(rowPointer++)
  sheet.mergeCells(grandRow.number, 1, grandRow.number, 5)
  const grandLabel = grandRow.getCell(1)
  grandLabel.value = "Grand Total"
  grandLabel.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } }
  grandLabel.alignment = { vertical: "middle", horizontal: "right" }

  grandRow.getCell(6).value = grand.totalBudgetRAB
  grandRow.getCell(6).numFmt = '"Rp" #,##0'
  grandRow.getCell(6).font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } }
  grandRow.getCell(6).alignment = { vertical: "middle", horizontal: "right" }

  grandRow.getCell(8).value = grand.totalBudgetReal
  grandRow.getCell(8).numFmt = '"Rp" #,##0'
  grandRow.getCell(8).font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } }
  grandRow.getCell(8).alignment = { vertical: "middle", horizontal: "right" }

  for (let c = 1; c <= 9; c++) {
    const cell = grandRow.getCell(c)
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB45309" } }
    cell.border = {
      top: { style: "thin", color: { argb: "FF92400E" } },
      left: { style: "thin", color: { argb: "FF92400E" } },
      bottom: { style: "thin", color: { argb: "FF92400E" } },
      right: { style: "thin", color: { argb: "FF92400E" } },
    }
  }

  const buffer = await workbook.xlsx.writeBuffer()

  const filename = `RAB-${sanitizeFilenamePart(project.name)}-${formatDateYYYYMMDD(new Date())}.xlsx`

  return new NextResponse(Buffer.from(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  })
}

