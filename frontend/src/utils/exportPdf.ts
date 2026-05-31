import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportEmployeesPdf(
  employees: Array<{
    name: string;
    transactions: number;
    sales: number;
    profit: number;
  }>
) {
  const doc = new jsPDF();

  doc.setFontSize(20);

  doc.text(
    "Employee Performance Report",
    14,
    20
  );

  autoTable(doc, {
    startY: 30,
    head: [[
      "Employee",
      "Transactions",
      "Sales",
      "Profit",
    ]],
    body: employees.map((employee) => [
      employee.name,
      employee.transactions,
      employee.sales.toFixed(2),
      employee.profit.toFixed(2),
    ]),
  });

  doc.save("employee-report.pdf");
}