import React, { useEffect, useState } from "react";
import medicalReportService from "../../Services/medicalReportService";

function AdminReportApprovals() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchReports = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await medicalReportService.getReports();
      if (res && res.data) {
        setReports(res.data);
      }
    } catch (err) {
      console.error("Error fetching medical reports:", err);
      if (!silent) showToast("Failed to load medical reports", "error");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    const interval = setInterval(() => {
      fetchReports(true);
    }, 4000);

    const onFocus = () => fetchReports(true);
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const handleApprove = async (reportId) => {
    try {
      setActionLoading(true);
      const res = await medicalReportService.approveReport(reportId);
      if (res && res.success) {
        showToast("Clinical report approved and certified successfully!");
        fetchReports();
        if (selectedReport && selectedReport._id === reportId) {
          setSelectedReport(res.data);
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to approve report", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    try {
      setActionLoading(true);
      const res = await medicalReportService.rejectReport(rejectModal._id, {
        rejectionReason: rejectionReason || "Incomplete findings. Please review and update.",
      });
      if (res && res.success) {
        showToast("Report rejected and returned to doctor with feedback.", "info");
        setRejectModal(null);
        setRejectionReason("");
        fetchReports();
        if (selectedReport && selectedReport._id === rejectModal._id) {
          setSelectedReport(null);
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to reject report", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPdf = async (report) => {
    try {
      showToast("Generating certified PDF...", "info");
      await medicalReportService.downloadPdf(
        report._id,
        `Medical-Report-${report.reportId}.pdf`
      );
      showToast("Report PDF downloaded successfully!");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to download PDF", "error");
    }
  };

  const filteredReports = reports.filter((report) => {
    const matchesStatus =
      filterStatus === "all" ? true : report.status === filterStatus;
    const s = search.toLowerCase();
    const matchesSearch =
      (report.reportId || "").toLowerCase().includes(s) ||
      (report.diagnosis || "").toLowerCase().includes(s) ||
      (report.patient?.name || "").toLowerCase().includes(s) ||
      (report.doctor?.name || "").toLowerCase().includes(s);
    return matchesStatus && matchesSearch;
  });

  const counts = {
    pending: reports.filter((r) => r.status === "pending_approval").length,
    approved: reports.filter((r) => r.status === "approved").length,
    rejected: reports.filter((r) => r.status === "rejected").length,
    all: reports.length,
  };

  return (
    <div style={{ padding: "90px 30px 40px 270px", background: "#f8fafc", minHeight: "100vh" }}>
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 9999,
            background:
              toast.type === "error"
                ? "#ef4444"
                : toast.type === "info"
                ? "#0284c7"
                : "#10b981",
            color: "#fff",
            padding: "12px 24px",
            borderRadius: "8px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
            fontSize: "14px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <i
            className={`bi ${
              toast.type === "error"
                ? "bi-exclamation-circle"
                : toast.type === "info"
                ? "bi-info-circle"
                : "bi-check-circle"
            }`}
          ></i>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
            Clinical Reports & Approvals
          </h2>
          <p style={{ fontSize: "14px", color: "#64748b", margin: "4px 0 0 0" }}>
            Comprehensive visibility and administrative monitoring for all hospital clinical reports.
          </p>
        </div>
        <button
          onClick={fetchReports}
          style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            padding: "8px 16px",
            borderRadius: "8px",
            color: "#334155",
            fontSize: "13px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <i className="bi bi-arrow-clockwise"></i> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "25px" }}>
        <div
          onClick={() => setFilterStatus("pending_approval")}
          style={{
            background: "#ffffff",
            padding: "18px 20px",
            borderRadius: "12px",
            border: filterStatus === "pending_approval" ? "2px solid #f59e0b" : "1px solid #e2e8f0",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "600" }}>PENDING APPROVAL</span>
            <span style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="bi bi-hourglass-split"></i>
            </span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#d97706", marginTop: "10px" }}>{counts.pending}</div>
        </div>

        <div
          onClick={() => setFilterStatus("approved")}
          style={{
            background: "#ffffff",
            padding: "18px 20px",
            borderRadius: "12px",
            border: filterStatus === "approved" ? "2px solid #10b981" : "1px solid #e2e8f0",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "600" }}>APPROVED & CERTIFIED</span>
            <span style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#d1fae5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="bi bi-check2-circle"></i>
            </span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#059669", marginTop: "10px" }}>{counts.approved}</div>
        </div>

        <div
          onClick={() => setFilterStatus("rejected")}
          style={{
            background: "#ffffff",
            padding: "18px 20px",
            borderRadius: "12px",
            border: filterStatus === "rejected" ? "2px solid #ef4444" : "1px solid #e2e8f0",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "600" }}>REJECTED / RETURNED</span>
            <span style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#fee2e2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="bi bi-x-circle"></i>
            </span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#dc2626", marginTop: "10px" }}>{counts.rejected}</div>
        </div>

        <div
          onClick={() => setFilterStatus("all")}
          style={{
            background: "#ffffff",
            padding: "18px 20px",
            borderRadius: "12px",
            border: filterStatus === "all" ? "2px solid #2563eb" : "1px solid #e2e8f0",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "600" }}>TOTAL REPORTS</span>
            <span style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#dbeafe", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="bi bi-folder2"></i>
            </span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#2563eb", marginTop: "10px" }}>{counts.all}</div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ background: "#ffffff", padding: "16px 20px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
        <div style={{ position: "relative", width: "350px" }}>
          <i className="bi bi-search" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}></i>
          <input
            type="text"
            placeholder="Search report ID, diagnosis, patient, doctor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "9px 14px 9px 38px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "13px", outline: "none" }}
          />
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          {["pending_approval", "approved", "rejected", "all"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterStatus(tab)}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: "500",
                cursor: "pointer",
                border: "none",
                background: filterStatus === tab ? "#2563eb" : "#f1f5f9",
                color: filterStatus === tab ? "#ffffff" : "#475569",
              }}
            >
              {tab === "pending_approval"
                ? "Pending"
                : tab === "approved"
                ? "Approved"
                : tab === "rejected"
                ? "Rejected"
                : "All"}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Table */}
      <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
        {loading ? (
          <div style={{ padding: "50px", textAlign: "center", color: "#64748b" }}>
            <div className="spinner-border text-primary" role="status"></div>
            <p style={{ marginTop: "12px", fontSize: "14px" }}>Loading clinical reports...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "#94a3b8" }}>
            <i className="bi bi-inbox" style={{ fontSize: "42px" }}></i>
            <h4 style={{ fontSize: "16px", color: "#475569", marginTop: "12px" }}>No clinical reports found</h4>
            <p style={{ fontSize: "13px" }}>There are no reports matching the selected filter criteria.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: "600" }}>
                <th style={{ padding: "14px 20px" }}>REPORT ID</th>
                <th style={{ padding: "14px 16px" }}>PATIENT</th>
                <th style={{ padding: "14px 16px" }}>ATTENDING DOCTOR</th>
                <th style={{ padding: "14px 16px" }}>VISIT DATE</th>
                <th style={{ padding: "14px 16px" }}>DIAGNOSIS</th>
                <th style={{ padding: "14px 16px" }}>STATUS</th>
                <th style={{ padding: "14px 20px", textAlign: "right" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => {
                const isPending = report.status === "pending_approval";
                const isApproved = report.status === "approved";
                const isRejected = report.status === "rejected";

                return (
                  <tr key={report._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "14px 20px", fontWeight: "600", color: "#1e40af" }}>
                      {report.reportId}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: "600", color: "#1e293b" }}>{report.patient?.name || "Patient"}</div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>{report.patient?.patientId || ""}</div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ color: "#334155" }}>{report.doctor?.name || "Attending Physician"}</div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>{report.doctor?.specialization || "General Medicine"}</div>
                    </td>
                    <td style={{ padding: "14px 16px", color: "#475569" }}>{report.visitDate}</td>
                    <td style={{ padding: "14px 16px", maxWidth: "220px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#1e293b" }}>
                      {report.diagnosis}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: "20px",
                          fontSize: "11px",
                          fontWeight: "600",
                          background: isApproved ? "#d1fae5" : isPending ? "#fef3c7" : isRejected ? "#fee2e2" : "#f1f5f9",
                          color: isApproved ? "#065f46" : isPending ? "#92400e" : isRejected ? "#991b1b" : "#475569",
                        }}
                      >
                        {isApproved ? "Approved" : isPending ? "Pending Review" : isRejected ? "Rejected" : "Draft"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => setSelectedReport(report)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            background: "#ffffff",
                            color: "#334155",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: "500",
                          }}
                        >
                          <i className="bi bi-eye"></i> View
                        </button>

                        {isPending && (
                          <>
                            <button
                              disabled={actionLoading}
                              onClick={() => handleApprove(report._id)}
                              style={{
                                padding: "6px 12px",
                                borderRadius: "6px",
                                border: "none",
                                background: "#10b981",
                                color: "#ffffff",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: "600",
                              }}
                            >
                              <i className="bi bi-check-lg"></i> Approve
                            </button>
                            <button
                              disabled={actionLoading}
                              onClick={() => {
                                setRejectModal(report);
                                setRejectionReason("");
                              }}
                              style={{
                                padding: "6px 12px",
                                borderRadius: "6px",
                                border: "none",
                                background: "#ef4444",
                                color: "#ffffff",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: "600",
                              }}
                            >
                              <i className="bi bi-x-lg"></i> Reject
                            </button>
                          </>
                        )}

                        {isApproved && (
                          <button
                            onClick={() => handleDownloadPdf(report)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "6px",
                              border: "none",
                              background: "#0284c7",
                              color: "#ffffff",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: "600",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <i className="bi bi-file-earmark-pdf"></i> PDF
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Clinical Report View Modal */}
      {selectedReport && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              width: "750px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              padding: "28px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #e2e8f0", paddingBottom: "16px", marginBottom: "20px" }}>
              <div>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#2563eb", textTransform: "uppercase" }}>Clinical Examination Record</span>
                <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: "4px 0 0 0" }}>
                  Report {selectedReport.reportId}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#94a3b8" }}
              >
                &times;
              </button>
            </div>

            {/* Patient & Doctor metadata */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", background: "#f8fafc", padding: "16px", borderRadius: "10px", marginBottom: "20px" }}>
              <div>
                <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>PATIENT INFORMATION</div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b", marginTop: "4px" }}>{selectedReport.patient?.name}</div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>ID: {selectedReport.patient?.patientId} | Age: {selectedReport.patient?.age} | Gender: {selectedReport.patient?.gender}</div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>ATTENDING DOCTOR</div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b", marginTop: "4px" }}>{selectedReport.doctor?.name}</div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>{selectedReport.doctor?.specialization} | Visit: {selectedReport.visitDate}</div>
              </div>
            </div>

            {/* Clinical fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <div style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Chief Complaint & Symptoms</div>
                <div style={{ fontSize: "13px", color: "#1e293b", background: "#f1f5f9", padding: "10px 14px", borderRadius: "8px", marginTop: "4px" }}>
                  {selectedReport.chiefComplaint || "N/A"} {selectedReport.symptoms ? ` | Symptoms: ${selectedReport.symptoms}` : ""}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "12px", fontWeight: "600", color: "#166534" }}>Clinical Diagnosis</div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#166534", background: "#dcfce7", padding: "10px 14px", borderRadius: "8px", marginTop: "4px" }}>
                  {selectedReport.diagnosis}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Diagnostic Tests & Laboratory Findings</div>
                <div style={{ fontSize: "13px", color: "#1e293b", background: "#f1f5f9", padding: "10px 14px", borderRadius: "8px", marginTop: "4px" }}>
                  {selectedReport.findings || selectedReport.testInvestigation || "Routine clinical evaluation performed."}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Prescribed Treatment & Recommendations</div>
                <div style={{ fontSize: "13px", color: "#1e293b", background: "#f1f5f9", padding: "10px 14px", borderRadius: "8px", marginTop: "4px" }}>
                  {selectedReport.treatment || "Standard symptomatic therapy."}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Doctor Notes & Remarks</div>
                <div style={{ fontSize: "13px", color: "#1e293b", background: "#f1f5f9", padding: "10px 14px", borderRadius: "8px", marginTop: "4px" }}>
                  {selectedReport.doctorNotes || "None recorded."}
                </div>
              </div>

              {selectedReport.approval?.rejectionReason && (
                <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", padding: "12px", borderRadius: "8px" }}>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "#b91c1c" }}>Rejection / Revision Reason</div>
                  <div style={{ fontSize: "13px", color: "#991b1b", marginTop: "4px" }}>{selectedReport.approval.rejectionReason}</div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #e2e8f0" }}>
              <button
                onClick={() => setSelectedReport(null)}
                style={{ padding: "8px 18px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#ffffff", color: "#475569", fontSize: "13px", cursor: "pointer" }}
              >
                Close
              </button>

              {selectedReport.status === "pending_approval" && (
                <>
                  <button
                    disabled={actionLoading}
                    onClick={() => {
                      setRejectModal(selectedReport);
                      setRejectionReason("");
                    }}
                    style={{ padding: "8px 18px", borderRadius: "8px", border: "none", background: "#ef4444", color: "#ffffff", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
                  >
                    Reject Report
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleApprove(selectedReport._id)}
                    style={{ padding: "8px 18px", borderRadius: "8px", border: "none", background: "#10b981", color: "#ffffff", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
                  >
                    Approve & Certify
                  </button>
                </>
              )}

              {selectedReport.status === "approved" && (
                <button
                  onClick={() => handleDownloadPdf(selectedReport)}
                  style={{ padding: "8px 18px", borderRadius: "8px", border: "none", background: "#0284c7", color: "#ffffff", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
                >
                  <i className="bi bi-download"></i> Download Official PDF
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              width: "480px",
              padding: "24px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            <h4 style={{ fontSize: "18px", fontWeight: "700", color: "#b91c1c", margin: "0 0 8px 0" }}>
              Return / Reject Medical Report
            </h4>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px 0" }}>
              Please provide a clinical or administrative reason so the doctor can correct and resubmit the report.
            </p>

            <textarea
              rows={4}
              placeholder="e.g. Please provide complete diagnostic test findings and verify blood pressure readings."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                fontSize: "13px",
                outline: "none",
                fontFamily: "inherit",
              }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "18px" }}>
              <button
                onClick={() => setRejectModal(null)}
                style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#ffffff", color: "#475569", fontSize: "13px", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={handleReject}
                style={{ padding: "8px 18px", borderRadius: "8px", border: "none", background: "#ef4444", color: "#ffffff", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminReportApprovals;
