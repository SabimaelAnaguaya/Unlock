export async function cargarMazo(ruta) {
  const respuesta = await fetch(ruta);

  if (!respuesta.ok) {
    throw new Error("No se pudo cargar el mazo: " + ruta);
  }

  return await respuesta.json();
}
