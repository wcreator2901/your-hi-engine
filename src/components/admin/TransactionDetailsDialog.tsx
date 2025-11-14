
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { formatNumber } from '@/utils/currencyFormatter';
import { Transaction, BankTransfer } from '@/types/adminTransactions';

interface TransactionDetailsDialogProps {
  transaction: Transaction | null;
  bankTransferDetails: BankTransfer | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TransactionDetailsDialog: React.FC<TransactionDetailsDialogProps> = ({
  transaction,
  bankTransferDetails,
  isOpen,
  onClose
}) => {
  if (!transaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xs sm:max-w-2xl text-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base text-white">Transaction Details</DialogTitle>
          <DialogDescription className="sr-only">View detailed information about this transaction</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-xs text-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><strong>ID:</strong> <span className="break-all">{transaction.id}</span></div>
            <div><strong>User:</strong> {transaction.user_profile?.full_name || 'Unknown'}</div>
            <div><strong>Asset:</strong> {transaction.asset_symbol}</div>
            <div><strong>Type:</strong> {transaction.transaction_type}</div>
            <div><strong>Crypto Amount:</strong> {transaction.crypto_amount}</div>
            <div><strong>USD Amount:</strong> ${formatNumber(transaction.usd_amount)}</div>
            <div><strong>Status:</strong> {transaction.status}</div>
            <div><strong>Date:</strong> {new Date(transaction.transaction_date).toLocaleString()}</div>
          </div>
          {transaction.to_address && (
            <div><strong>Withdrawal Address:</strong> <span className="break-all">{transaction.to_address}</span></div>
          )}
          {transaction.transaction_hash && (
            <div><strong>Transaction Hash:</strong> <span className="break-all">{transaction.transaction_hash}</span></div>
          )}
          {(transaction.bank_transfer_id || transaction.transaction_type === 'bank_transfer') && bankTransferDetails && (
            <div className="border-t pt-3">
              <h4 className="font-medium text-sm mb-2">Bank Transfer Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div><strong>IBAN:</strong> {bankTransferDetails.iban || 'N/A'}</div>
                <div><strong>Recipient's Full Name:</strong> {bankTransferDetails.account_name || 'N/A'}</div>
                <div><strong>BIC/SWIFT Code:</strong> {bankTransferDetails.bic_swift || 'N/A'}</div>
                <div><strong>Reference/Payment Description:</strong> {bankTransferDetails.reference || 'N/A'}</div>
                <div><strong>Amount (EUR):</strong> {bankTransferDetails.amount_fiat} EUR</div>
                <div><strong>Amount (USD):</strong> {bankTransferDetails.amount_fiat ? (bankTransferDetails.amount_fiat / 0.93).toFixed(2) : 'N/A'} USD</div>
              </div>
            </div>
          )}
          {(transaction.transaction_type === 'bank_transfer' && !bankTransferDetails) && (
            <div className="border-t pt-3">
              <p className="text-xs text-white/70">Bank transfer details not found</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
