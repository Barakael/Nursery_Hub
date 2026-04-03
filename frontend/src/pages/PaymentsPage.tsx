import { CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useStudents } from "@/hooks/useStudents";
import { useStudentBalance, useStudentPayments } from "@/hooks/usePayments";

const PaymentsPage = () => {
  const { user } = useAuth();

  // For parents, show first child's data; for staff show aggregate overview
  const { data: studentsData } = useStudents();
  const students = studentsData?.data ?? [];
  const firstStudent = students[0];

  const { data: balance } = useStudentBalance(firstStudent?.id ?? 0);
  const { data: payments = [] } = useStudentPayments(firstStudent?.id ?? 0);

  const totalFee = balance?.total_fees ?? 0;
  const totalPaid = balance?.total_paid ?? 0;
  const remaining = balance?.remaining ?? 0;
  const percent = balance?.percent_paid ?? 0;

  if (!firstStudent) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-muted-foreground animate-fade-in">
        <AlertCircle className="h-10 w-10 opacity-30" />
        <p>No student data available</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Fee Summary */}
      <div className="rounded-2xl bg-primary p-5 shadow-card">
        <p className="text-sm font-medium text-primary-foreground/70">
          {firstStudent.name} — Total Fees
        </p>
        <p className="text-3xl font-extrabold text-primary-foreground">₦{totalFee.toLocaleString()}</p>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-primary-foreground/20">
          <div
            className="h-full rounded-full bg-primary-foreground transition-all"
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-primary-foreground/70">
          <span>Paid: ₦{totalPaid.toLocaleString()}</span>
          <span>{percent}% Complete</span>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-card p-4 shadow-soft text-center">
          <CheckCircle className="mx-auto mb-1 h-6 w-6 text-success" />
          <p className="text-lg font-bold text-success">₦{totalPaid.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Amount Paid</p>
        </div>
        <div className="rounded-2xl bg-card p-4 shadow-soft text-center">
          <AlertCircle className="mx-auto mb-1 h-6 w-6 text-destructive" />
          <p className="text-lg font-bold text-destructive">₦{remaining.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Balance Due</p>
        </div>
      </div>

      {/* Payment History */}
      <div className="rounded-2xl bg-card p-5 shadow-card">
        <h3 className="mb-3 font-bold text-card-foreground">Payment History</h3>
        {payments.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No payments recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl bg-accent/50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/15">
                    <CheckCircle className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-card-foreground">₦{p.amount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.method ?? "—"} {p.reference ? `• ${p.reference}` : ""}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{p.payment_date}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentsPage;
