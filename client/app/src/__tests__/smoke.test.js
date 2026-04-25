import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Home from "../Home";
import { AuthProvider } from "../context/AuthContext";
import { ShopProvider } from "../context/ShopContext";

jest.mock("../api/client", () => {
  const mock = {
    get: jest.fn(async () => ({ data: [] })),
    post: jest.fn(async () => ({ data: {} })),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
  };
  const setTokens = jest.fn();
  const clearTokens = jest.fn();
  return { __esModule: true, default: mock, setTokens, clearTokens };
});

describe("Smoke: Home renders", () => {
  test("renders hero CTA", async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <ShopProvider>
            <Home />
          </ShopProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/забронировать время/i).length).toBeGreaterThan(0);
    });
  });
});
