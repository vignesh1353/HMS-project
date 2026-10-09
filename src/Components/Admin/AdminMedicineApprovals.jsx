import React, { useEffect, useState } from "react";
import medicineRequestService from "../../Services/medicineRequestService";

function AdminMedicineApprovals() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("pending_approval");
  const [search, setSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchRequests = async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true);
      const res = await medicineRequestService.getRequests();
      if (res && res.data) {
        setRequests(res.data);
      }
    } catch (err) {
      console.error("Error fetching medicine requests:", err);
      if (showSpinner) showToast("Failed to load medicine requests", "error");
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(true);

    const interval = setInterval(() => {
      fetchRequests(false);
    }, 6000);

    const onFocus = () => {
      fetchRequests(false);
    };
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const handleApprove = async (requestId) => {
    try {
      setActionLoading(true);
      const res = await medicineRequestService.approveRequest(requestId);
      if (res && res.success) {
        showToast("Medicine request approved and pharmacy inventory stock deducted!");
        fetchRequests();
        if (selectedRequest && selectedRequest._id === requestId) {
          setSelectedRequest(res.data);
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to approve medicine request", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    try {
      setActionLoading(true);
      const res = await medicineRequestService.rejectRequest(rejectModal._id, {
        rejectionReason: rejectionReason || "Prescription verification failed or stock unavailable.",
      });
      if (res && res.success) {
        showToast("Medicine request rejected.", "info");
        setRejectModal(null);
        setRejectionReason("");
        fetchRequests();
        if (selectedRequest && selectedRequest._id === rejectModal._id) {
          setSelectedRequest(null);
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to reject request", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispense = async (requestId) => {
    try {
      setActionLoading(true);
      const res = await medicineRequestService.dispenseRequest(requestId);
      if (res && res.success) {
        showToast("Medication marked as dispensed to patient!");
        fetchRequests();
        if (selectedRequest && selectedRequest._id === requestId) {
          setSelectedRequest(res.data);
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to dispense medication", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRequests = requests.filter((req) => {
    const matchesStatus =
      filterStatus === "all" ? true : req.status === filterStatus;
    const s = search.toLowerCase();
    const matchesSearch =
      (req.requestId || "").toLowerCase().includes(s) ||
      (req.prescriptionNo || "").toLowerCase().includes(s) ||
      (req.prescription?.prescriptionNo || "").toLowerCase().includes(s) ||
      (req.patientId || "").toLowerCase().includes(s) ||
      (req.patientReferenceNumber || "").toLowerCase().includes(s) ||
      (req.patient?.patientId || "").toLowerCase().includes(s) ||
      (req.patient?.name || req.patientName || "").toLowerCase().includes(s) ||
      (req.report?.reportId || "").toLowerCase().includes(s) ||
      (req.doctor?.name || "").toLowerCase().includes(s) ||
      (req.medicines || []).some((m) =>
        (m.medicineName || "").toLowerCase().includes(s)
      );
    return matchesStatus && matchesSearch;
  });

  const counts = {
    pending: requests.filter((r) => r.status === "pending_approval").length,
    approved: requests.filter((r) => r.status === "approved").length,
    dispensed: requests.filter((r) => r.status === "dispensed").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
    all: requests.length,
  };

  return (
    <div style={{ padding: "90px 30px 40px 270px", background: "#f8fafc", minHeight: "100vh" }}>
      {/* Toast Alert */}
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
            Manage Medicine Requests
          </h2>
          <p style={{ fontSize: "14px", color: "#64748b", margin: "4px 0 0 0" }}>
            Verify report-linked medication requests, check warehouse stock, and authorize inventory release.
          </p>
        </div>
        <button
          onClick={fetchRequests}
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
            <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "600" }}>PENDING REVIEW</span>
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
            <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "600" }}>APPROVED (STOCK DEDUCTED)</span>
            <span style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#d1fae5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="bi bi-check-circle"></i>
            </span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#059669", marginTop: "10px" }}>{counts.approved}</div>
        </div>

        <div
          onClick={() => setFilterStatus("dispensed")}
          style={{
            background: "#ffffff",
            padding: "18px 20px",
            borderRadius: "12px",
            border: filterStatus === "dispensed" ? "2px solid #0284c7" : "1px solid #e2e8f0",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "600" }}>DISPENSED</span>
            <span style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#e0f2fe", color: "#0284c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="bi bi-box-seam"></i>
            </span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#0284c7", marginTop: "10px" }}>{counts.dispensed}</div>
        </div>

        <div
          onClick={() => setFilterStatus("all")}
          style={{
            background: "#ffffff",
            padding: "18px 20px",
            borderRadius: "12px",
            border: filterStatus === "all" ? "2px solid #64748b" : "1px solid #e2e8f0",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "600" }}>TOTAL REQUESTS</span>
            <span style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#f1f5f9", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="bi bi-capsule"></i>
            </span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#475569", marginTop: "10px" }}>{counts.all}</div>
        </div>
      </div>

      {/* Filter and Search */}
      <div style={{ background: "#ffffff", padding: "16px 20px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ position: "relative", width: "350px" }}>
          <i className="bi bi-search" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}></i>
          <input
            type="text"
            placeholder="Search request ID, patient, medicine, report ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "9px 14px 9px 38px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "13px", outline: "none" }}
          />
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          {["pending_approval", "approved", "dispensed", "rejected", "all"].map((tab) => (
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
                : tab === "dispensed"
                ? "Dispensed"
                : tab === "rejected"
                ? "Rejected"
                : "All"}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Table */}
      <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
        {loading ? (
          <div style={{ padding: "50px", textAlign: "center", color: "#64748b" }}>
            <div className="spinner-border text-primary" role="status"></div>
            <p style={{ marginTop: "12px", fontSize: "14px" }}>Loading medicine requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "#94a3b8" }}>
            <i className="bi bi-capsule" style={{ fontSize: "42px" }}></i>
            <h4 style={{ fontSize: "16px", color: "#475569", marginTop: "12px" }}>No medicine requests found</h4>
            <p style={{ fontSize: "13px" }}>No requests match the selected status filter.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: "600" }}>
                <th style={{ padding: "14px 20px" }}>REQUEST ID</th>
                <th style={{ padding: "14px 16px" }}>PATIENT</th>
                <th style={{ padding: "14px 16px" }}>SOURCE</th>
                <th style={{ padding: "14px 16px" }}>REQUESTED MEDICINES</th>
                <th style={{ padding: "14px 16px" }}>DATE</th>
                <th style={{ padding: "14px 16px" }}>STATUS</th>
                <th style={{ padding: "14px 20px", textAlign: "right" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req) => {
                const isPending = req.status === "pending_approval";
                const isApproved = req.status === "approved";
                const isDispensed = req.status === "dispensed";
                const isRejected = req.status === "rejected";

                return (
                  <tr key={req._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "14px 20px", fontWeight: "600", color: "#1e40af" }}>
                      {req.requestId}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: "600", color: "#1e293b" }}>{req.patient?.name || req.patientName || "Patient"}</div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>
                        <span style={{ fontWeight: "600", color: "#0284c7" }}>
                          {req.patient?.patientId || req.patientId || req.patientReferenceNumber || "ID Pending"}
                        </span>
                        {req.patient?.phone ? ` • ${req.patient.phone}` : ""}
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      {req.prescriptionNo || req.source === "prescription" ? (
                        <span style={{ padding: "4px 9px", background: "#f0fdf4", color: "#166534", borderRadius: "6px", fontWeight: "700", fontSize: "11px", border: "1px solid #bbf7d0", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <i className="bi bi-file-earmark-medical"></i> Rx: {req.prescriptionNo || req.prescription?.prescriptionNo || "Doctor Rx"}
                        </span>
                      ) : (
                        <span style={{ padding: "4px 9px", background: "#eff6ff", color: "#1d4ed8", borderRadius: "6px", fontWeight: "600", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <i className="bi bi-file-earmark-text"></i> {req.report?.reportId || "Approved Report"}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      {(req.medicines || []).map((m, idx) => (
                        <div key={idx} style={{ fontSize: "12px", color: "#334155" }}>
                          &bull; <strong>{m.medicineName}</strong> &mdash; {m.dosage} &times; {m.quantity} pcs
                        </div>
                      ))}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#64748b" }}>
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: "20px",
                          fontSize: "11px",
                          fontWeight: "600",
                          background: isDispensed ? "#e0f2fe" : isApproved ? "#d1fae5" : isPending ? "#fef3c7" : "#fee2e2",
                          color: isDispensed ? "#0369a1" : isApproved ? "#065f46" : isPending ? "#92400e" : "#991b1b",
                        }}
                      >
                        {isDispensed
                          ? "Dispensed"
                          : isApproved
                          ? "Approved (Stock Deducted)"
                          : isPending
                          ? "Pending Approval"
                          : "Rejected"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => setSelectedRequest(req)}
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
                          Details
                        </button>

                        {isPending && (
                          <>
                            <button
                              disabled={actionLoading}
                              onClick={() => handleApprove(req._id)}
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
                              Approve
                            </button>
                            <button
                              disabled={actionLoading}
                              onClick={() => {
                                setRejectModal(req);
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
                              Reject
                            </button>
                          </>
                        )}

                        {isApproved && (
                          <button
                            disabled={actionLoading}
                            onClick={() => handleDispense(req._id)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "6px",
                              border: "none",
                              background: "#0284c7",
                              color: "#ffffff",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: "600",
                            }}
                          >
                            Dispense
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

      {/* Request Details Modal */}
      {selectedRequest && (
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
              width: "650px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "28px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #e2e8f0", paddingBottom: "16px", marginBottom: "20px" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#0284c7", textTransform: "uppercase" }}>Pharmacy Request Verification</span>
                <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: "4px 0 0 0" }}>
                  {selectedRequest.requestId}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#94a3b8" }}
              >
                &times;
              </button>
            </div>

            <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "8px", marginBottom: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px" }}>
                <div>
                  <strong>Patient:</strong> {selectedRequest.patient?.name || selectedRequest.patientName || "Patient"}{" "}
                  <span style={{ color: "#0284c7", fontWeight: "600" }}>
                    ({selectedRequest.patient?.patientId || selectedRequest.patientId || selectedRequest.patientReferenceNumber || "N/A"})
                  </span>
                </div>
                <div>
                  <strong>Source:</strong>{" "}
                  {selectedRequest.prescriptionNo || selectedRequest.source === "prescription"
                    ? `Doctor Prescription (${selectedRequest.prescriptionNo || selectedRequest.prescription?.prescriptionNo || "Rx"})`
                    : selectedRequest.report?.reportId || "Approved Clinical Report"}
                </div>
                <div><strong>Doctor:</strong> {selectedRequest.doctor?.name || selectedRequest.prescription?.doctor || "Consulting Doctor"}</div>
                <div><strong>Status:</strong> {selectedRequest.status}</div>
              </div>
            </div>

            <h5 style={{ fontSize: "14px", fontWeight: "700", color: "#334155", marginBottom: "10px" }}>Requested Medication Items:</h5>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
              {(selectedRequest.medicines || []).map((med, idx) => (
                <div key={idx} style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "12px 14px", borderRadius: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: "700", color: "#1e293b", fontSize: "14px" }}>{med.medicineName}</div>
                    <span style={{ background: "#eff6ff", color: "#1d4ed8", padding: "3px 8px", borderRadius: "4px", fontWeight: "700", fontSize: "12px" }}>
                      Qty: {med.quantity}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                    Dosage: {med.dosage} | Frequency: {med.frequency} | Duration: {med.duration}
                  </div>
                  <div style={{ fontSize: "12px", color: "#047857", marginTop: "2px" }}>
                    Instructions: {med.instructions}
                  </div>
                </div>
              ))}
            </div>

            {selectedRequest.approval?.rejectionReason && (
              <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#b91c1c" }}>Rejection Reason</div>
                <div style={{ fontSize: "13px", color: "#991b1b", marginTop: "4px" }}>{selectedRequest.approval.rejectionReason}</div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "14px", borderTop: "1px solid #e2e8f0" }}>
              <button
                onClick={() => setSelectedRequest(null)}
                style={{ padding: "8px 18px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#ffffff", color: "#475569", fontSize: "13px", cursor: "pointer" }}
              >
                Close
              </button>

              {selectedRequest.status === "pending_approval" && (
                <>
                  <button
                    disabled={actionLoading}
                    onClick={() => {
                      setRejectModal(selectedRequest);
                      setRejectionReason("");
                    }}
                    style={{ padding: "8px 18px", borderRadius: "8px", border: "none", background: "#ef4444", color: "#ffffff", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
                  >
                    Reject
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleApprove(selectedRequest._id)}
                    style={{ padding: "8px 18px", borderRadius: "8px", border: "none", background: "#10b981", color: "#ffffff", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
                  >
                    Approve & Deduct Stock
                  </button>
                </>
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
              width: "460px",
              padding: "24px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            <h4 style={{ fontSize: "18px", fontWeight: "700", color: "#b91c1c", margin: "0 0 8px 0" }}>
              Reject Medicine Request
            </h4>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px 0" }}>
              Please state why this request cannot be approved (e.g. inventory shortage, dosage mismatch).
            </p>

            <textarea
              rows={3}
              placeholder="e.g. Insufficient stock available or dosage clarification needed."
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

export default AdminMedicineApprovals;
