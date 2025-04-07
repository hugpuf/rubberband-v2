
import { Account } from "@/modules/accounting/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencyDisplay } from "./CurrencyDisplay";
import { AccountTypeBadge } from "./AccountTypeBadge";

interface AccountCardProps {
  account: Account;
  onClick?: () => void;
}

export function AccountCard({ account, onClick }: AccountCardProps) {
  return (
    <Card 
      className={`overflow-hidden transition-all ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base font-medium">{account.name}</CardTitle>
          <AccountTypeBadge type={account.type} />
        </div>
        <p className="text-xs text-muted-foreground font-mono">
          {account.code}
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">Current Balance</div>
          <CurrencyDisplay 
            amount={account.balance} 
            className="text-lg font-semibold" 
          />
        </div>
      </CardContent>
    </Card>
  );
}
