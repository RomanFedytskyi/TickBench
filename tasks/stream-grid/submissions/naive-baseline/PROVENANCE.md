# Provenance: naive-baseline

Hand-written baseline used for **oracle validation** (`tickbench validate` requires it to
fail). It implements the task the way a hurried first pass often does: full innerHTML
re-render per tick, unsanitized interpolation of untrusted strings, float+toFixed(2) money
formatting without locale separators, and no caption/scope/ARIA. Not model output.
