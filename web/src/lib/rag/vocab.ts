// Human-readable labels for the controlled vocabularies used in resolution
// classification and RAG retrieval — see schema.prisma's FailureMode /
// Component enums for the canonical source of truth.

export const FAILURE_MODES = [
  { value: "bearing_failure", label: "Bearing failure" },
  { value: "seal_gasket_leak", label: "Seal/gasket leak" },
  { value: "electrical_fault", label: "Electrical fault" },
  { value: "control_instrumentation_fault", label: "Control/instrumentation fault" },
  { value: "corrosion", label: "Corrosion" },
  { value: "fouling", label: "Fouling" },
  { value: "overload", label: "Overload" },
  { value: "refrigerant_leak", label: "Refrigerant leak" },
  { value: "sensor_failure", label: "Sensor failure" },
  { value: "human_error", label: "Human error" },
  { value: "other", label: "Other" },
] as const;

export const COMPONENTS = [
  { value: "compressor", label: "Compressor" },
  { value: "condenser", label: "Condenser" },
  { value: "evaporator", label: "Evaporator" },
  { value: "control_panel", label: "Control panel" },
  { value: "refrigerant_circuit", label: "Refrigerant circuit" },
  { value: "motor", label: "Motor" },
  { value: "bearing", label: "Bearing" },
  { value: "seal", label: "Seal" },
  { value: "impeller", label: "Impeller" },
  { value: "coupling", label: "Coupling" },
  { value: "burner", label: "Burner" },
  { value: "refractory", label: "Refractory" },
  { value: "safety_valve", label: "Safety valve" },
  { value: "tube_bundle", label: "Tube bundle" },
  { value: "gasket", label: "Gasket" },
  { value: "sensor", label: "Sensor" },
  { value: "valve", label: "Valve" },
  { value: "other", label: "Other" },
] as const;
