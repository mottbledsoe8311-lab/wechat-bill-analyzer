from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.units import inch
import datetime

# 创建PDF
pdf_file = "/tmp/test_bill.pdf"
doc = SimpleDocTemplate(pdf_file, pagesize=A4, topMargin=0.5*inch, bottomMargin=0.5*inch)

# 样式
styles = getSampleStyleSheet()
title_style = ParagraphStyle(
    'CustomTitle',
    parent=styles['Heading1'],
    fontSize=16,
    textColor=colors.HexColor('#000000'),
    spaceAfter=12,
)

# 内容
story = []

# 标题
title = Paragraph("微信账单", title_style)
story.append(title)
story.append(Spacer(1, 0.2*inch))

# 账户信息
account_data = [
    ['账户名称', '张三'],
    ['账户ID', '1234567890'],
    ['账单周期', '2026年2月28日 至 2026年3月8日'],
]

account_table = Table(account_data, colWidths=[2*inch, 4*inch])
account_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
    ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
    ('FONTSIZE', (0, 0), (-1, -1), 10),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
    ('GRID', (0, 0), (-1, -1), 1, colors.black)
]))

story.append(account_table)
story.append(Spacer(1, 0.3*inch))

# 交易记录表格
transactions_data = [
    ['交易时间', '交易类型', '交易方式', '交易对方', '金额', '收/支'],
]

# 添加一些测试交易记录
test_transactions = [
    ['2026-03-08 10:30:00', '转账', '零钱', '朋友A', '100.00', '支'],
    ['2026-03-08 09:15:00', '转账', '零钱', '朋友B', '50.00', '支'],
    ['2026-03-07 14:20:00', '转账', '零钱', '商家C', '88.88', '支'],
    ['2026-03-07 11:45:00', '收款', '零钱', '朋友D', '200.00', '收'],
    ['2026-03-06 16:30:00', '转账', '银行卡', '工商银行', '500.00', '支'],
    ['2026-03-06 13:20:00', '转账', '银行卡', '建设银行', '1000.00', '支'],
    ['2026-03-05 10:00:00', '转账', '储蓄卡', '农业银行', '300.00', '支'],
]

for tx in test_transactions:
    transactions_data.append(tx)

transactions_table = Table(transactions_data, colWidths=[1.5*inch, 1*inch, 1*inch, 1.5*inch, 1*inch, 0.5*inch])
transactions_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 10),
    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
    ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ('FONTSIZE', (0, 1), (-1, -1), 9),
]))

story.append(transactions_table)

# 生成PDF
doc.build(story)
print(f"✓ 测试PDF已创建: {pdf_file}")
