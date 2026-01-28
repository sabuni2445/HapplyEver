import { API_URL } from "./config";

type HttpMethod = "GET" | "POST";

async function request<T>(path: string, method: HttpMethod = "GET", body?: any): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed (${res.status}): ${text}`);
  }
  return res.json();
}

// ------- API wrappers --------

export async function getWeddingDetails(clerkId: string) {
  return request(`/weddings/${clerkId}`, "GET");
}

export async function getPaymentsByWedding(weddingId: number) {
  return request(`/payments/wedding/${weddingId}`, "GET");
}

export async function initializeChapaPayment(payload: any) {
  return request(`/payments/chapa/initialize`, "POST", payload);
}

export async function verifyChapaPayment(txRef: string) {
  return request(`/payments/chapa/verify?txRef=${encodeURIComponent(txRef)}`, "GET");
}

export async function getUserByClerkId(clerkId: string) {
  return request(`/users/clerk/${clerkId}`, "GET");
}






