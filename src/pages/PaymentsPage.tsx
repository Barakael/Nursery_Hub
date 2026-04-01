import { CheckCircle, Clock, AlertCircle } from "lucide-react";

const payments = [
  { id: 1, date: "Mar 28, 2026", amount: 50000, method: "Bank Transfer", ref: "PAY-001" },
  { id: 2, date: "Feb 15, 2026", amount: 30000, method: "Cash", ref: "PAY-002" },
];

const totalFee = 120000;
const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
const balance = totalFee - totalPaid;
const percent = Math.round((totalPaid / totalFee) * 100);

const PaymentsPage = () => {
  return (
    <div className="animate-fade-in space-y-6">
      {/* Fee Summary */}
      <div className="rounded-2xl bg-primary p-5 shadow-card">
        <p className="text-sm font-medium text-primary-foreground/70">Total School Fees</p>
        <p className="text-3xl font-extrabold text-primary-foreground">₦{totalFee.toLocaleString()}</p>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-primary-foreground/20">
          <div
            className="h-full rounded-full bg-secondary transition-all"
            style={{ width: `${percent}%` }}
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
          <p className="text-lg font-bold text-destructive">₦{balance.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Balance Due</p>
        </div>
      </div>

      {/* Payment History */}
      <div className="rounded-2xl bg-card p-5 shadow-card">
        <h3 className="mb-3 font-bold text-card-foreground">Payment History</h3>
        <div className="space-y-3">
          {payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl bg-accent/50 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/15">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-card-foreground">₦{p.amount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{p.method} • {p.ref}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{p.date}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PaymentsPage;
