import type {
  ConversionSelectedItem,
  ConversionPreviewResponse,
  ConversionConfirmItem,
  ConversionResult,
} from './conversionTypes';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

function headers(token: string, orgId: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    'X-Organization-Id': orgId,
  };
}

function ptBrError(status: number): string {
  switch (status) {
    case 401:
      return 'Sessão expirada. Faça login novamente.';
    case 403:
      return 'Você não tem permissão para acessar este relatório.';
    case 404:
      return 'Relatório de Check-up não encontrado.';
    case 422:
      return 'Este Check-up ainda não foi concluído. Aguarde a finalização da análise.';
    default:
      return 'Erro ao processar conversão. Tente novamente.';
  }
}

export async function previewConversion(
  reportId: string,
  orgId: string,
  token: string,
  selectedItems: ConversionSelectedItem[]
): Promise<ConversionPreviewResponse> {
  const res = await fetch(
    `${API_BASE}/api/checkup/reports/${encodeURIComponent(reportId)}/conversion/preview`,
    {
      method: 'POST',
      headers: headers(token, orgId),
      body: JSON.stringify({ selectedItems }),
    }
  );

  if (!res.ok) {
    const msg = ptBrError(res.status);
    throw new Error(msg);
  }

  return res.json() as Promise<ConversionPreviewResponse>;
}

export async function confirmConversion(
  reportId: string,
  orgId: string,
  token: string,
  items: ConversionConfirmItem[]
): Promise<ConversionResult> {
  const res = await fetch(
    `${API_BASE}/api/checkup/reports/${encodeURIComponent(reportId)}/conversion/confirm`,
    {
      method: 'POST',
      headers: headers(token, orgId),
      body: JSON.stringify({ items }),
    }
  );

  if (!res.ok) {
    const msg = ptBrError(res.status);
    throw new Error(msg);
  }

  return res.json() as Promise<ConversionResult>;
}
