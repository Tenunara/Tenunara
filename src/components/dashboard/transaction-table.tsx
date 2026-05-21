"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { DashboardTransaction, VerificationStatus } from "@/lib/types";

const STATUS_LABEL: Record<VerificationStatus, string> = {
  menunggu_penjemputan: "Menunggu Penjemputan",
  dalam_perjalanan: "Dalam Perjalanan",
  terverifikasi_match: "Terverifikasi",
  dibatalkan: "Dibatalkan",
  sengketa: "Sengketa",
};

const STATUS_VARIANT: Record<
  VerificationStatus,
  "outline" | "secondary" | "default" | "destructive"
> = {
  menunggu_penjemputan: "outline",
  dalam_perjalanan: "secondary",
  terverifikasi_match: "default",
  dibatalkan: "destructive",
  sengketa: "destructive",
};

interface TransactionTableProps {
  transactions: DashboardTransaction[];
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-2xl border border-[#E5DDD5] bg-white text-sm text-[#4F626399]">
        Belum ada transaksi
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#E5DDD5] bg-white shadow-sm">
      <div className="p-5 pb-3">
        <h3 className="text-sm font-semibold text-tenunara-charcoal">
          Riwayat Transaksi Terkini
        </h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tanggal</TableHead>
            <TableHead>Material</TableHead>
            <TableHead>Grade</TableHead>
            <TableHead>Berat</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Penerima</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.transaction_id}>
              <TableCell className="text-xs">
                {formatDate(tx.timestamp)}
              </TableCell>
              <TableCell className="text-xs capitalize">
                {tx.material_type}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {tx.grade}
                </Badge>
              </TableCell>
              <TableCell className="text-xs">{tx.weight_kg} kg</TableCell>
              <TableCell className="text-xs font-medium">
                Rp {tx.subtotal.toLocaleString("id-ID")}
              </TableCell>
              <TableCell className="max-w-[120px] truncate text-xs">
                {tx.receiver_name}
              </TableCell>
              <TableCell>
                <Badge
                  variant={STATUS_VARIANT[tx.verification_status] || "outline"}
                  className="text-xs"
                >
                  {STATUS_LABEL[tx.verification_status] ||
                    tx.verification_status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
