
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
                <div><strong>Account Name:</strong> {bankTransferDetails.account_name}</div>
                <div><strong>Account Number:</strong> {bankTransferDetails.account_number}</div>
                <div><strong>Institution Number:</strong> {bankTransferDetails.bsb_number?.split('-')[0] || 'N/A'}</div>
                <div><strong>Transit Number (Branch Number):</strong> {bankTransferDetails.bsb_number?.split('-')[1] || 'N/A'}</div>
                <div><strong>Email or Mobile Number:</strong> {bankTransferDetails.email_or_mobile || 'N/A'}</div>
                <div><strong>Amount:</strong> {bankTransferDetails.amount_fiat} {bankTransferDetails.currency}</div>
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
