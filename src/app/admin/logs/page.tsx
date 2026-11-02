import { listAuditLogs } from "@/actions/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LogsPage() {
  const logs = await listAuditLogs();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sistem Kayıtları (Loglar)</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Son Sistem Etkinlikleri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {logs.length > 0 ? (
              logs.map((l: any) => (
                <div key={l.id} className="flex items-center justify-between p-4">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{l.action}</div>
                    <div className="text-xs text-muted-foreground">
                      {l.entity} {l.entityId || ""} ·
                      {l.tenant?.name || "platform"} ·
                      {new Date(l.createdAt).toLocaleString("tr-TR")}
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    {l.userId || "-"}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground p-4">Henüz kayıt yok.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
