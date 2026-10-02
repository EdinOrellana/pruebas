import type { InputHTMLAttributes } from "react";
import { AlertCircle } from "lucide-react";
import { HintTooltip } from "./HintTooltip";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** Longitud maxima esperada del valor; define el ancho del campo en ch. */
  maxLength?: number;
  /** Aplica fuente monoespaciada (numeros de cheque, IDs, codigos). */
  mono?: boolean;
  /** Texto explicativo emergente al hacer hover sobre el icono (?) */
  tooltip?: string;
  /** Texto de ayuda pequeno debajo del input (opcional). */
  hint?: string;
  /** Mensaje de validacion de error si el formato es invalido */
  error?: string;
}

/** Campo de formulario del sistema CPX: label + input (.cpx-field). */
export function FormField({
  label,
  maxLength,
  mono,
  tooltip,
  hint,
  error,
  className,
  type,
  style,
  ...rest
}: FormFieldProps) {
  const inputClasses = [
    "cpx-field__input",
    mono ? "cpx-mono" : "",
    error ? "cpx-field__input--error" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  // Los inputs type="date" agregan icono/separadores propios del navegador que no
  // siguen el ancho por caracter (ch); se les da un ancho fijo con margen de sobra.
  const width =
    style?.width ||
    (type === "date" ? "160px" : maxLength ? `calc(${Math.max(maxLength, 6)}ch + 24px)` : "100%");

  return (
    <div className="cpx-field" style={{ width, ...style }}>
      <label className="cpx-field__label" style={{ display: "flex", alignItems: "center", gap: "2px" }}>
        <span>{label}</span>
        {rest.required && <span style={{ color: "var(--cpx-danger, #ff3b30)", marginLeft: "2px" }}>*</span>}
        {tooltip && <HintTooltip text={tooltip} />}
      </label>
      <input
        className={inputClasses}
        type={type}
        maxLength={maxLength}
        {...rest}
      />
      {error ? (
        <span className="cpx-field__error">
          <AlertCircle size={12} /> {error}
        </span>
      ) : hint && !tooltip ? (
        <span className="cpx-field__hint">{hint}</span>
      ) : null}
    </div>
  );
}


