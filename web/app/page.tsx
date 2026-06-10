"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  Container,
  Title,
  Table,
  Badge,
  Group,
  Text,
  SegmentedControl,
  Select,
  Loader,
  Alert,
  Button,
  Flex,
  Card,
} from "@mantine/core";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { CompanyListItem } from "@/lib/types";

const priorityColors: Record<string, string> = {
  ALTA: "red",
  MEDIA: "yellow",
  BAJA: "green",
};

const riskColors: Record<string, string> = {
  HIGH: "red",
  MEDIUM: "orange",
  LOW: "green",
};

const lifecycleColors: Record<string, string> = {
  ENROLADO: "blue",
  ACTIVO: "teal",
  RECURRENTE: "violet",
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

function TrendArrow({ pct }: { pct: number }) {
  if (pct > 0.05)
    return (
      <Text span c="green" fw={700}>
        ↑ {Math.round(pct * 100)}%
      </Text>
    );
  if (pct < -0.05)
    return (
      <Text span c="red" fw={700}>
        ↓ {Math.abs(Math.round(pct * 100))}%
      </Text>
    );
  return (
    <Text span c="dimmed">
      → {Math.round(pct * 100)}%
    </Text>
  );
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("priority");

  const isAuthMock = process.env.NEXT_PUBLIC_AUTH_MODE === "mock";

  useEffect(() => {
    if (status === "unauthenticated" && isAuthMock) {
      signIn("credentials", { redirect: false });
    }
  }, [status, isAuthMock]);

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (sort !== "priority") params.set("sort", sort);
      if (filter !== "all")
        params.set("filter", filter === "risk" ? "at_risk" : "expansion");
      const qs = params.toString();
      const data = await apiFetch<CompanyListItem[]>(
        `/companies${qs ? `?${qs}` : ""}`
      );
      setCompanies(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error cargando empresas"
      );
    } finally {
      setLoading(false);
    }
  }, [sort, filter]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchCompanies();
    }
  }, [status, fetchCompanies]);

  if (status === "loading") {
    return (
      <Container py="xl" ta="center">
        <Loader size="lg" />
      </Container>
    );
  }

  if (status === "unauthenticated" && !isAuthMock) {
    return (
      <Container py="xl" ta="center">
        <Card shadow="sm" p="xl" maw={400} mx="auto">
          <Title order={2} mb="md">
            Xepelin CRM
          </Title>
          <Text c="dimmed" mb="lg">
            Inicia sesión para acceder a tu cartera
          </Text>
          <Button onClick={() => signIn("google")} fullWidth>
            Iniciar sesión con Google
          </Button>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="xl" py="md">
      <Flex justify="space-between" align="center" mb="md">
        <Title order={2}>Mi Cartera</Title>
        <Group>
          <Text size="sm" c="dimmed">
            {(session?.user as Record<string, unknown>)?.name as string}
          </Text>
          <Button variant="subtle" size="xs" onClick={() => signOut()}>
            Cerrar sesión
          </Button>
        </Group>
      </Flex>

      <Group mb="md">
        <SegmentedControl
          value={filter}
          onChange={setFilter}
          data={[
            { label: "Todos", value: "all" },
            { label: "En riesgo", value: "risk" },
            { label: "Oportunidad", value: "expansion" },
          ]}
        />
        <Select
          value={sort}
          onChange={(v) => setSort(v || "priority")}
          data={[
            { label: "Prioridad", value: "priority" },
            { label: "Riesgo", value: "risk" },
            { label: "Volumen", value: "volume" },
          ]}
          w={150}
        />
      </Group>

      {error && (
        <Alert color="red" mb="md" title="Error">
          {error}
        </Alert>
      )}

      {loading ? (
        <Loader display="block" mx="auto" mt="xl" />
      ) : companies.length === 0 ? (
        <Alert color="gray" title="Sin empresas">
          No hay empresas que mostrar con los filtros seleccionados.
        </Alert>
      ) : (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Empresa</Table.Th>
              <Table.Th>País</Table.Th>
              <Table.Th>Lifecycle</Table.Th>
              <Table.Th>Prioridad</Table.Th>
              <Table.Th>Vol. 90d</Table.Th>
              <Table.Th>Tendencia</Table.Th>
              <Table.Th>SOW</Table.Th>
              <Table.Th>Riesgo</Table.Th>
              <Table.Th>Últ. interacción</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {companies.map((c) => (
              <Table.Tr
                key={c.id}
                style={{ cursor: "pointer" }}
                onClick={() => router.push(`/companies/${c.id}`)}
              >
                <Table.Td>
                  <Text fw={600} size="sm">
                    {c.legalName}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {c.industry}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Badge variant="light" size="sm">
                    {c.country}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Badge
                    color={lifecycleColors[c.lifecycleStage] || "gray"}
                    variant="light"
                    size="sm"
                  >
                    {c.lifecycleStage}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Badge
                    color={priorityColors[c.signals.priorityLabel]}
                    variant="filled"
                    size="sm"
                  >
                    {c.signals.priorityLabel}
                  </Badge>
                  <Text size="xs" c="dimmed" mt={2}>
                    {c.signals.priorityReason}
                  </Text>
                </Table.Td>
                <Table.Td>
                  {formatCurrency(c.signals.financedVolume90d)}
                </Table.Td>
                <Table.Td>
                  <TrendArrow pct={c.signals.volumeTrendPct} />
                </Table.Td>
                <Table.Td>{formatPct(c.signals.sowPct)}</Table.Td>
                <Table.Td>
                  <Badge
                    color={riskColors[c.signals.churnRisk]}
                    variant="dot"
                    size="sm"
                  >
                    {c.signals.churnRisk}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  {c.daysSinceLastInteraction !== null
                    ? `${c.daysSinceLastInteraction}d`
                    : "—"}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Container>
  );
}
