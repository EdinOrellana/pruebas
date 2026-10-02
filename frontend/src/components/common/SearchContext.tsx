import { createContext, useContext, useState, type ReactNode } from "react";

interface SearchContextValue {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}

const SearchContext = createContext<SearchContextValue | null>(null);

/**
 * Provee el termino de busqueda del header (AppShell) a la pagina activa,
 * para que cada vista filtre su propia tabla sobre los datos ya cargados.
 */
export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchTerm, setSearchTerm] = useState("");
  return (
    <SearchContext.Provider value={{ searchTerm, setSearchTerm }}>
      {children}
    </SearchContext.Provider>
  );
}

/** Hook de acceso al termino de busqueda global. */
export function useSearch(): SearchContextValue {
  const ctx = useContext(SearchContext);
  if (!ctx) {
    throw new Error("useSearch debe usarse dentro de un SearchProvider");
  }
  return ctx;
}
