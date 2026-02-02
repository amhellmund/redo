import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { App } from "./App.tsx";

describe("App", () => {
  it("renders the placeholder page", () => {
    render(<App />);
    expect(screen.getByText("redo")).toBeDefined();
    expect(screen.getByText("Manage your recurring tasks.")).toBeDefined();
  });
});
