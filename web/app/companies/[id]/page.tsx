"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import {
  Container,
  Title,
  Text,
  Badge,
  Group,
  Grid,
  Card,
  Table,
  Textarea,
  Button,
  Loader,
  Alert,
  Timeline,
  Select,
  Flex,
} from "@mantine/core";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { apiFetch } from "@/lib/api-client";
import { CompanyDetail } from "@/lib/types";

const riskColors: Record<string, string> = {
  HIGH: "red",
  MEDIUM: "orange",
  LOW: "green",
};

const channelLabels: Record<string, string> = {
  WHATSAPP: "WhatsApp",
  CALL: "Llamada",
  EMAIL: "Email",
  MEETING: "Reunión",
};

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatPct(n: number | null): string {
  if (n === null) return "—";
  return `${Math.round(n * 100)}%`;
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("es-CL");
}

function daysSince(d: string): number {
  return Math.floor(
    (Date.now() - new Date(d).getTime()) / (24 * 60 * 60 * 1000)
  );
}

function buildVolumeChart(
  operations: CompanyDetail["operations"]
): { month: string; volumen: number }[] {
  const monthMap = new Map<string, number>();
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, 0);
  }
  for (const op of operations) {
    if (op.type === "FACTORING" || op.type === "CONFIRMING") {
      const d = new Date(op.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (monthMap.has(key)) {
        monthMap.set(key, (monthMap.get(key) || 0) + op.amount);
      }
    }
  }
  return Array.from(monthMap.entries()).map(([month, volumen]) => ({
    month,
    volumen,
  }));
}

export default function CompanyDetailPage() {
  const { status } = useSession();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [statusVal, setStatusVal] = useState("active");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const fetchCompany = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch<CompanyDetail>(`/companies/${id}`);
      setCompany(data);
      setNotes(data.notes || "");
      setStatusVal(data.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando empresa");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchCompany();
    }
  }, [status, fetchCompany]);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      await apiFetch(`/companies/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ notes, status: statusVal }),
      });
      setSaveMsg("Guardado");
      setTimeout(() => setSaveMsg(null), 2000);
    } catch (err) {
      setSaveMsg(
        err instanceof Error ? err.message : "Error al guardar"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container py="xl" ta="center">
        <Loader size="lg" />
      </Container>
    );
  }

  if (error || !company) {
    return (
      <Container py="xl">
        <Alert color="red" title="Error">
          {error || "Empresa no encontrada"}
        </Alert>
        <Button mt="md" variant="subtle" onClick={() => router.push("/")}>
          Volver
        </Button>
      </Container>
    );
  }

  const s = company.signals;
  const volumeData = buildVolumeChart(company.operations);

  return (
    <Container size="xl" py="md">
      <Button variant="subtle" mb="md" onClick={() => router.push("/")}>
        ← Volver al listado
      </Button>

      {/* Header */}
      <Flex justify="space-between" align="start" mb="lg" wrap="wrap" gap="md">
        <div>
          <Title order={2}>{company.legalName}</Title>
          <Text c="dimmed" size="sm">
            {company.taxId} · {company.industry} · {company.country}
          </Text>
          <Group mt="xs">
            <Badge variant="light">{company.segment}</Badge>
            <Badge
              variant="light"
              color={
                company.lifecycleStage === "RECURRENTE"
                  ? "violet"
                  : company.lifecycleStage === "ACTIVO"
                    ? "teal"
                    : "blue"
              }
            >
              {company.lifecycleStage}
            </Badge>
            <Text size="xs" c="dimmed">
              Antigüedad: {daysSince(company.onboardedAt)}d
            </Text>
          </Group>
        </div>
        <Group>
          <Select
            label="Estado"
            value={statusVal}
            onChange={(v) => setStatusVal(v || "active")}
            data={[
              { label: "Activo", value: "active" },
              { label: "Inactivo", value: "inactive" },
              { label: "Suspendido", value: "suspended" },
            ]}
            w={140}
          />
        </Group>
      </Flex>

      {/* AI Panel placeholder */}
      <Card shadow="xs" mb="lg" p="md" withBorder>
        <Title order={5} mb="xs">
          Análisis IA
        </Title>
        {company.healthScore !== null ? (
          <Text>Health Score: {company.healthScore}</Text>
        ) : (
          <Text c="dimmed" fs="italic">
            Análisis IA no disponible aún (se genera en la Parte 2).
          </Text>
        )}
      </Card>

      {/* Metrics */}
      <Grid mb="lg">
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="xs" p="sm" withBorder>
            <Text size="xs" c="dimmed">
              Línea aprobada
            </Text>
            <Text fw={700}>{formatCurrency(company.creditLineApproved)}</Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="xs" p="sm" withBorder>
            <Text size="xs" c="dimmed">
              Línea usada
            </Text>
            <Text fw={700}>
              {formatCurrency(company.creditLineUsed)}{" "}
              <Text span size="xs" c="dimmed">
                ({formatPct(s.lineUtilization)})
              </Text>
            </Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="xs" p="sm" withBorder>
            <Text size="xs" c="dimmed">
              Vol. financiado 90d
            </Text>
            <Text fw={700}>{formatCurrency(s.financedVolume90d)}</Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="xs" p="sm" withBorder>
            <Text size="xs" c="dimmed">
              Profit estimado 90d
            </Text>
            <Text fw={700}>{formatCurrency(s.estGrossProfit90d)}</Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="xs" p="sm" withBorder>
            <Text size="xs" c="dimmed">
              SOW
            </Text>
            <Text fw={700}>{formatPct(s.sowPct)}</Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="xs" p="sm" withBorder>
            <Text size="xs" c="dimmed">
              Riesgo churn
            </Text>
            <Badge color={riskColors[s.churnRisk]} variant="filled">
              {s.churnRisk}
            </Badge>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="xs" p="sm" withBorder>
            <Text size="xs" c="dimmed">
              Mora
            </Text>
            <Text fw={700} c={s.hasOverdue ? "red" : undefined}>
              {s.hasOverdue
                ? formatCurrency(s.overdueAmount)
                : "Sin mora"}
            </Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="xs" p="sm" withBorder>
            <Text size="xs" c="dimmed">
              Prioridad
            </Text>
            <Badge
              color={
                s.priorityLabel === "ALTA"
                  ? "red"
                  : s.priorityLabel === "MEDIA"
                    ? "yellow"
                    : "green"
              }
              variant="filled"
            >
              {s.priorityLabel}
            </Badge>
            <Text size="xs" mt={2}>
              {s.priorityReason}
            </Text>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Volume chart */}
      <Card shadow="xs" mb="lg" p="md" withBorder>
        <Title order={5} mb="sm">
          Volumen financiado por mes
        </Title>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={volumeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" fontSize={12} />
            <YAxis fontSize={12} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
            />
            <Bar dataKey="volumen" fill="#228be6" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Operations */}
      <Card shadow="xs" mb="lg" p="md" withBorder>
        <Title order={5} mb="sm">
          Historial de operaciones
        </Title>
        {company.operations.length === 0 ? (
          <Text c="dimmed">Sin operaciones registradas.</Text>
        ) : (
          <Table striped withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Tipo</Table.Th>
                <Table.Th>Monto</Table.Th>
                <Table.Th>Fecha</Table.Th>
                <Table.Th>Estado</Table.Th>
                <Table.Th>Mora (días)</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {company.operations.map((op) => (
                <Table.Tr key={op.id}>
                  <Table.Td>
                    <Badge variant="light" size="sm">
                      {op.type}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{formatCurrency(op.amount)}</Table.Td>
                  <Table.Td>{formatDate(op.date)}</Table.Td>
                  <Table.Td>
                    <Badge
                      color={
                        op.status === "VENCIDA"
                          ? "red"
                          : op.status === "PENDIENTE"
                            ? "yellow"
                            : "green"
                      }
                      variant="light"
                      size="sm"
                    >
                      {op.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {op.daysPastDue > 0 ? (
                      <Text c="red" fw={600}>
                        {op.daysPastDue}
                      </Text>
                    ) : (
                      "—"
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>

      {/* Interactions timeline */}
      <Card shadow="xs" mb="lg" p="md" withBorder>
        <Title order={5} mb="sm">
          Timeline de interacciones
        </Title>
        {company.interactions.length === 0 ? (
          <Text c="dimmed">Sin interacciones registradas.</Text>
        ) : (
          <Timeline active={0} bulletSize={20} lineWidth={2}>
            {company.interactions.map((inter) => (
              <Timeline.Item
                key={inter.id}
                title={channelLabels[inter.channel] || inter.channel}
              >
                <Text size="xs" c="dimmed">
                  {formatDate(inter.date)}
                </Text>
                <Text size="sm" mt={4}>
                  {inter.summary}
                </Text>
              </Timeline.Item>
            ))}
          </Timeline>
        )}
      </Card>

      {/* Notes */}
      <Card shadow="xs" mb="lg" p="md" withBorder>
        <Title order={5} mb="sm">
          Notas
        </Title>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.currentTarget.value)}
          minRows={3}
          autosize
          mb="sm"
        />
        <Group>
          <Button onClick={handleSave} loading={saving} size="sm">
            Guardar
          </Button>
          {saveMsg && (
            <Text size="sm" c={saveMsg === "Guardado" ? "green" : "red"}>
              {saveMsg}
            </Text>
          )}
        </Group>
      </Card>
    </Container>
  );
}
