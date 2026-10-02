import type { UnidadMedida, UnidadMedidaForm } from "./UnidadMedidaTypes";

const API_URL = "http://localhost:3000/api/unidades-medida";

export const obtenerUnidadesMedida = async (): Promise<UnidadMedida[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error("Error al obtener las unidades de medida");
  return response.json();
};

export const crearUnidadMedida = async (data: UnidadMedidaForm): Promise<UnidadMedida> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error al crear la unidad de medida");
  return response.json();
};

// NUEVA FUNCIÓN: Para actualizar registros
export const actualizarUnidadMedidaAPI = async (id: number, data: UnidadMedidaForm): Promise<void> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error al actualizar la unidad de medida");
};

export const eliminarUnidadMedidaAPI = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Error al eliminar la unidad de medida");
};
