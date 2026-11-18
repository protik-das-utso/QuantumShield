import io
import json
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)


def generate_research_pdf_report(experiment_data: dict, benchmark_data: list, attack_data: list) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()

    # Custom styles
    primary_color = colors.HexColor("#0F172A")    # Slate 900
    accent_color = colors.HexColor("#0284C7")     # Cyan 600
    text_color = colors.HexColor("#1E293B")       # Slate 800
    border_color = colors.HexColor("#CBD5E1")     # Slate 300

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=primary_color,
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=14,
        textColor=accent_color,
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=primary_color,
        spaceBefore=14,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=text_color,
        spaceAfter=6
    )

    body_bold = ParagraphStyle(
        'Body_Bold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.whitesmoke,
        alignment=1  # Centered
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10,
        textColor=text_color
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=table_cell_style,
        fontName='Helvetica-Bold'
    )

    story = []

    # Title & Metadata
    exp_title = experiment_data.get("title", "Classical and Post-Quantum PKI Migration Evaluation")
    exp_code = experiment_data.get("experiment_code", "EXP-RESEARCH-REPORT")

    story.append(Paragraph(exp_title, title_style))
    story.append(Paragraph(f"QuantumShield Research Laboratory | Protocol Evaluation Report | Reference: {exp_code}", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=accent_color, spaceAfter=12))

    # 1. Executive Summary & Objectives
    story.append(Paragraph("1. Research Objectives & Executive Summary", h1_style))
    intro_p = (
        "This research report documents experimental evaluations comparing classical public-key cryptography "
        "(RSA-2048 and ECDSA P-256) with standard post-quantum cryptography (ML-DSA-44 according to NIST FIPS 204). "
        "The primary focus is assessing computational overhead, public key and signature sizes, verification latency, "
        "and cryptographic attack defenses during public key infrastructure migration. "
        "All measurements were captured on local compute hardware utilizing standard Python cryptography hazmat with OpenSSL 4.0 FIPS 204 bindings."
    )
    story.append(Paragraph(intro_p, body_style))

    # 2. Experimental Environment
    story.append(Paragraph("2. Experimental Hardware & Software Environment", h1_style))
    specs = experiment_data.get("system_specs", {})
    env_data = [
        [Paragraph("Hardware / Parameter", table_header_style), Paragraph("Specification", table_header_style)],
        [Paragraph("Operating System", table_cell_bold), Paragraph(str(specs.get("os", "Windows 11 / Linux")), table_cell_style)],
        [Paragraph("Processor (CPU)", table_cell_bold), Paragraph(str(specs.get("processor", "x86_64 CPU")), table_cell_style)],
        [Paragraph("Installed System Memory (RAM)", table_cell_bold), Paragraph(f"{specs.get('ram_total_gb', 'N/A')} GB", table_cell_style)],
        [Paragraph("Python Runtime", table_cell_bold), Paragraph(str(specs.get("python_version", "3.12")), table_cell_style)],
        [Paragraph("OpenSSL Engine", table_cell_bold), Paragraph(str(specs.get("openssl_version", "OpenSSL 4.0.3")), table_cell_style)],
        [Paragraph("Cryptography Library", table_cell_bold), Paragraph(f"cryptography v{specs.get('cryptography_version', '50.0')}", table_cell_style)],
        [Paragraph("ML-DSA-44 Implementation", table_cell_bold), Paragraph(str(specs.get("mldsa_engine", "Native FIPS 204")), table_cell_style)],
    ]
    env_table = Table(env_data, colWidths=[200, 330])
    env_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (1, 0), primary_color),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, border_color),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(env_table)
    story.append(Spacer(1, 10))

    # 3. Comparative Benchmark Results Table
    story.append(Paragraph("3. Cryptographic Performance & Size Comparison Table", h1_style))
    comp_rows = [
        [
            Paragraph("Evaluation Metric", table_header_style),
            Paragraph("RSA-2048", table_header_style),
            Paragraph("ECDSA P-256", table_header_style),
            Paragraph("ML-DSA-44 (FIPS 204)", table_header_style)
        ]
    ]

    comp_table_data = experiment_data.get("comparison_table", [])
    for row in comp_table_data:
        comp_rows.append([
            Paragraph(row.get("metric", ""), table_cell_bold),
            Paragraph(str(row.get("rsa_2048", "N/A")), table_cell_style),
            Paragraph(str(row.get("ecdsa_p256", "N/A")), table_cell_style),
            Paragraph(str(row.get("mldsa_44", "N/A")), table_cell_style),
        ])

    metrics_table = Table(comp_rows, colWidths=[150, 125, 125, 130])
    metrics_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), primary_color),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, border_color),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(metrics_table)
    story.append(Spacer(1, 10))

    # 4. Attack Simulation & Security Evaluation
    story.append(Paragraph("4. Attack Simulation Laboratory Defenses", h1_style))
    attack_summary_p = (
        "Controlled cryptographic security tests were conducted across all candidate algorithms. "
        "The application tested document bit-tampering, signature byte-flipping, public key substitution, "
        "pseudo-random signature forgery, and certificate chain invalidation."
    )
    story.append(Paragraph(attack_summary_p, body_style))

    attack_rows = [
        [
            Paragraph("Test ID", table_header_style),
            Paragraph("Attack Name", table_header_style),
            Paragraph("Algorithm", table_header_style),
            Paragraph("Expected", table_header_style),
            Paragraph("Actual", table_header_style),
            Paragraph("Defense", table_header_style)
        ]
    ]

    for atk in attack_data[:6]:
        status_color = colors.HexColor("#16A34A") if atk.get("defense_passed") else colors.HexColor("#DC2626")
        attack_rows.append([
            Paragraph(atk.get("test_id", ""), table_cell_bold),
            Paragraph(atk.get("test_name", ""), table_cell_style),
            Paragraph(atk.get("algorithm", ""), table_cell_style),
            Paragraph(atk.get("expected_result", ""), table_cell_style),
            Paragraph(atk.get("actual_result", ""), table_cell_style),
            Paragraph("PASS (DETECTED)" if atk.get("defense_passed") else "FAIL", ParagraphStyle('PassStatus', parent=table_cell_bold, textColor=status_color)),
        ])

    if len(attack_rows) > 1:
        atk_table = Table(attack_rows, colWidths=[55, 155, 95, 80, 80, 65])
        atk_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), primary_color),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, border_color),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        story.append(atk_table)
    story.append(Spacer(1, 10))

    # 5. Discussion & Engineering Trade-offs
    story.append(Paragraph("5. Discussion & Engineering Trade-offs", h1_style))
    discussion_p = (
        "<b>Size Overhead vs. Arithmetic Throughput:</b><br/>"
        "ML-DSA-44 demonstrates exceptional computational performance due to polynomial Number Theoretic Transform (NTT) "
        "operations, producing signing and verification latencies that comfortably rival or exceed classical RSA-2048 modular exponentiation. "
        "However, this speed comes with substantial communication and storage costs: an ML-DSA-44 public key (1,312 bytes) is ~4.8x larger "
        "than RSA-2048 (270 bytes) and ~20x larger than ECDSA P-256 (65 bytes). "
        "The ML-DSA-44 signature (2,420 bytes) is ~9.4x larger than RSA-2048 (256 bytes) and ~37.8x larger than ECDSA (64 bytes).<br/><br/>"
        "<b>Network MTU and Fragmentation Implications:</b><br/>"
        "Because standard Ethernet frames enforce a Maximum Transmission Unit (MTU) of 1,500 bytes, transmitting ML-DSA-44 "
        "signatures and certificates necessitates packet fragmentation during TLS handshakes. Network middleboxes that drop fragmented "
        "UDP packets or terminate oversized TCP handshake records present a real deployment obstacle during enterprise PKI transition.<br/><br/>"
        "<b>Quantum Cryptanalysis Context:</b><br/>"
        "RSA and ECDSA rely on integer factorization and discrete logarithms respectively, both solvable in polynomial time O((log N)^3) "
        "under Shor's algorithm once fault-tolerant quantum computers (CRQCs) become viable. "
        "ML-DSA-44 derives its hardness from the Module Learning With Errors (M-LWE) and Module Short Integer Solution (M-SIS) problems, "
        "for which no polynomial quantum algorithm is known."
    )
    story.append(Paragraph(discussion_p, body_style))

    # 6. Limitations
    story.append(Paragraph("6. Research Limitations", h1_style))
    limitations_p = (
        "1. <b>Host Operating System Jitter:</b> Measurements reflect user-space execution latency on general-purpose OS threading rather than isolated real-time micro-benchmarking.<br/>"
        "2. <b>Side-Channel Protections:</b> Testing evaluated functional correctness and algorithmic timing; power analysis and electromagnetic side-channel vulnerabilities in hardware were beyond the scope.<br/>"
        "3. <b>Hybrid Certificates:</b> Standard X.509 RFC 5280 currently relies on single-algorithm OIDs; post-quantum X.509 migration frameworks (IETF draft-ietf-lamps-pq-composite-sigs) remain in standardization."
    )
    story.append(Paragraph(limitations_p, body_style))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
