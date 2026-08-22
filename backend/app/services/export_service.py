import io
import pandas as pd
from datetime import datetime
from decimal import Decimal
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.models.bill import Bill
from app.schemas.report import SalesReport, InventoryReport, ProfitReport


def generate_invoice_pdf(bill: Bill) -> bytes:
    """Generate a production-quality PDF invoice for a given Bill."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'InvoiceTitle',
        parent=styles['Heading1'],
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#1E293B'),
        fontName='Helvetica-Bold'
    )
    
    subtitle_style = ParagraphStyle(
        'InvoiceSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748B')
    )

    bold_style = ParagraphStyle(
        'BoldText',
        parent=styles['Normal'],
        fontSize=10,
        leading=13,
        fontName='Helvetica-Bold',
        textColor=colors.HexColor('#0F172A')
    )

    cell_style = ParagraphStyle(
        'CellText',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#334155')
    )

    cell_right = ParagraphStyle(
        'CellRight',
        parent=cell_style,
        alignment=2
    )

    story = []

    # Header Section
    header_data = [
        [
            Paragraph("RetailDock System", title_style),
            Paragraph(f"INVOICE<br/><font size=9 color='#64748B'>#{bill.bill_number}</font>", ParagraphStyle('InvNum', parent=title_style, fontSize=16, leading=20, alignment=2))
        ],
        [
            Paragraph("Retail Inventory & POS System<br/>Email: support@retaildock.io", subtitle_style),
            Paragraph(f"Date: {bill.created_at.strftime('%Y-%m-%d %H:%M')}<br/>Payment: <b>{bill.payment_method.value}</b> ({bill.payment_status.value})", ParagraphStyle('InvMeta', parent=subtitle_style, alignment=2))
        ]
    ]

    header_table = Table(header_data, colWidths=[270, 270])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 15))

    # Customer & Cashier Info Block
    cust_name = bill.customer.name if bill.customer else "Walk-in Customer"
    cust_phone = bill.customer.phone if (bill.customer and bill.customer.phone) else "N/A"
    cashier_name = bill.cashier.full_name or bill.cashier.username if bill.cashier else "System"

    info_data = [
        [
            Paragraph(f"<b>Billed To:</b><br/>{cust_name}<br/>Phone: {cust_phone}", cell_style),
            Paragraph(f"<b>Issued By:</b><br/>Cashier: {cashier_name}<br/>Station: Terminal-1", cell_style)
        ]
    ]
    info_table = Table(info_data, colWidths=[270, 270])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E2E8F0')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP')
    ]))
    story.append(info_table)
    story.append(Spacer(1, 15))

    # Items Table
    items_data = [
        [
            Paragraph("Item / Product", bold_style),
            Paragraph("Qty", bold_style),
            Paragraph("Unit Price (₹)", ParagraphStyle('RBold', parent=bold_style, alignment=2)),
            Paragraph("Subtotal (₹)", ParagraphStyle('RBold', parent=bold_style, alignment=2))
        ]
    ]

    for item in bill.items:
        prod_name = item.product.name if item.product else "Product Removed"
        items_data.append([
            Paragraph(prod_name, cell_style),
            Paragraph(str(item.quantity), cell_style),
            Paragraph(f"₹{item.unit_price:.2f}", cell_right),
            Paragraph(f"₹{item.subtotal:.2f}", cell_right)
        ])

    items_table = Table(items_data, colWidths=[250, 60, 115, 115])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 15))

    # Totals Summary Table
    totals_data = [
        [Paragraph("Subtotal:", cell_style), Paragraph(f"₹{bill.subtotal:.2f}", cell_right)],
        [Paragraph(f"Discount ({bill.discount_percentage:.1f}%):", cell_style), Paragraph(f"- ₹{bill.discount_amount:.2f}", cell_right)],
        [Paragraph(f"GST / Tax ({bill.gst_percentage:.1f}%):", cell_style), Paragraph(f"+ ₹{bill.gst_amount:.2f}", cell_right)],
        [Paragraph("<b>Grand Total:</b>", bold_style), Paragraph(f"<b>₹{bill.total_amount:.2f}</b>", ParagraphStyle('GrTot', parent=bold_style, alignment=2, fontSize=12))]
    ]

    totals_table = Table(totals_data, colWidths=[380, 160])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('LINEBELOW', (0, 2), (-1, 2), 1, colors.HexColor('#0F172A')),
        ('BACKGROUND', (0, 3), (-1, 3), colors.HexColor('#F1F5F9')),
    ]))
    story.append(totals_table)
    story.append(Spacer(1, 25))

    # Footer
    footer_text = Paragraph(
        "Thank you for your business! For any inquiries, please present this invoice.",
        ParagraphStyle('Footer', parent=styles['Normal'], fontSize=9, alignment=1, textColor=colors.HexColor('#64748B'))
    )
    story.append(footer_text)

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()


def generate_sales_report_pdf(sales_report: SalesReport, inventory_report: InventoryReport, profit_report: ProfitReport) -> bytes:
    """Generate executive sales & analytics summary PDF."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle('RepTitle', parent=styles['Heading1'], fontSize=20, textColor=colors.HexColor('#0F172A'))
    cell_style = ParagraphStyle('Cell', parent=styles['Normal'], fontSize=9)
    bold_style = ParagraphStyle('Bold', parent=styles['Normal'], fontSize=9, fontName='Helvetica-Bold')

    story = [
        Paragraph("RetailDock — Executive Business & Sales Report", title_style),
        Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M')}", ParagraphStyle('Sub', parent=styles['Normal'], textColor=colors.HexColor('#64748B'))),
        Spacer(1, 15)
    ]

    # Key Performance Indicators Table
    kpi_data = [
        [Paragraph("Metric", bold_style), Paragraph("Value", bold_style)],
        [Paragraph("Today's Sales Revenue", cell_style), Paragraph(f"₹{sales_report.today_sales:.2f}", cell_style)],
        [Paragraph("Monthly Revenue", cell_style), Paragraph(f"₹{sales_report.monthly_sales:.2f}", cell_style)],
        [Paragraph("Total Revenue (All Time)", cell_style), Paragraph(f"₹{sales_report.total_revenue:.2f}", cell_style)],
        [Paragraph("Total Bills Processed", cell_style), Paragraph(str(sales_report.total_bills), cell_style)],
        [Paragraph("Average Bill Value", cell_style), Paragraph(f"₹{sales_report.average_bill_value:.2f}", cell_style)],
        [Paragraph("Estimated Net Profit", cell_style), Paragraph(f"₹{profit_report.total_profit:.2f}", cell_style)],
        [Paragraph("Profit Margin Percentage", cell_style), Paragraph(f"{profit_report.profit_margin_percentage:.2f}%", cell_style)],
        [Paragraph("Total Products in Inventory", cell_style), Paragraph(str(inventory_report.total_products), cell_style)],
        [Paragraph("Low-Stock Alerts", cell_style), Paragraph(str(inventory_report.low_stock_count), cell_style)],
    ]

    kpi_table = Table(kpi_data, colWidths=[300, 240])
    kpi_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E293B')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('PADDING', (0, 0), (-1, -1), 6)
    ]))
    story.append(kpi_table)

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()


def generate_sales_excel(daily_breakdown: list, profit_report: ProfitReport = None) -> bytes:
    """Generate Excel spreadsheet for daily sales breakdown and executive summary."""
    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
        if profit_report:
            summary_data = [
                {"Metric": "Total Revenue (₹)", "Value": float(profit_report.total_revenue)},
                {"Metric": "Cost of Goods Sold (COGS) (₹)", "Value": float(profit_report.total_cost_of_goods_sold)},
                {"Metric": "Net Profit (₹)", "Value": float(profit_report.total_profit)},
                {"Metric": "Profit Margin (%)", "Value": float(profit_report.profit_margin_percentage)},
            ]
            df_summary = pd.DataFrame(summary_data)
            df_summary.to_excel(writer, index=False, sheet_name='Executive Summary')

        data = []
        for item in daily_breakdown:
            data.append({
                "Date": item.date,
                "Revenue (₹)": float(item.revenue),
                "Total Bills": item.bills_count,
                "Avg Bill Value (₹)": float(item.revenue / item.bills_count) if item.bills_count > 0 else 0.0
            })

        df_daily = pd.DataFrame(data)
        df_daily.to_excel(writer, index=False, sheet_name='Daily Breakdown')

    buffer.seek(0)
    return buffer.getvalue()
