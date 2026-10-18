"use client";
// "use client" marks this file (and everything it imports) as a Client Component:
// it runs in the browser, so it can use state, effects, and browser APIs like localStorage.
//
// REACT CONCEPTS IN THIS FILE
//   useReducer  - state that changes through named "actions" (like a mini Redux)
//   Context     - share that state with any component without passing props down
//   useEffect   - sync state to localStorage (a side effect, outside React)
//   custom hook - useCart() wraps useContext with a helpful error

import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";

import type { MenuItem } from "@/lib/types";

export type CartLine = {
  id: string; // menu item id
  name: string;
  price: number; // shown in the UI only; the backend recalculates the real total
  image_url: string | null;
  quantity: number;
};

type CartState = { lines: CartLine[]; loaded: boolean };

// A "discriminated union": each action has a `type`, and TypeScript knows which
// other fields exist for each type inside the switch below.
type CartAction =
  | { type: "load"; lines: CartLine[] }
  | { type: "add"; item: MenuItem }
  | { type: "setQuantity"; id: string; quantity: number }
  | { type: "remove"; id: string }
  | { type: "clear" };

// A reducer is a PURE function: (old state, action) => new state.
// Never mutate `state`; always return a new object/array.
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "load":
      return { lines: action.lines, loaded: true };
    case "add": {
      const existing = state.lines.find((l) => l.id === action.item.id);
      if (existing) {
        return {
          ...state,
          lines: state.lines.map((l) =>
            l.id === action.item.id ? { ...l, quantity: l.quantity + 1 } : l,
          ),
        };
      }
      const { id, name, price, image_url } = action.item;
      return { ...state, lines: [...state.lines, { id, name, price, image_url, quantity: 1 }] };
    }
    case "setQuantity":
      if (action.quantity <= 0) {
        return { ...state, lines: state.lines.filter((l) => l.id !== action.id) };
      }
      return {
        ...state,
        lines: state.lines.map((l) =>
          l.id === action.id ? { ...l, quantity: Math.min(action.quantity, 50) } : l,
        ),
      };
    case "remove":
      return { ...state, lines: state.lines.filter((l) => l.id !== action.id) };
    case "clear":
      // Returning the SAME object tells React nothing changed, so it skips the re-render.
      return state.lines.length === 0 ? state : { ...state, lines: [] };
  }
}

type CartContextValue = {
  lines: CartLine[];
  loaded: boolean;
  count: number;
  subtotal: number;
  addItem: (item: MenuItem) => void;
  setQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { lines: [], loaded: false });

  // Effect 1: load the saved cart ONCE after the first render (empty deps array []).
  // Why not read localStorage directly in useReducer's initial state? This
  // component is also rendered on the server, where localStorage doesn't exist,
  // and the server HTML must match the first browser render ("hydration").
  useEffect(() => {
    let saved: CartLine[] = [];
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    } catch {
      // corrupted or blocked storage: start with an empty cart
    }
    dispatch({ type: "load", lines: saved });
  }, []);

  // Effect 2: save whenever the lines change (runs after every render where
  // state.lines is a different array than before).
  useEffect(() => {
    if (!state.loaded) return; // don't overwrite storage with the initial empty cart
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.lines));
    } catch {
      // storage full or blocked: the cart still works for this visit
    }
  }, [state.lines, state.loaded]);

  // useMemo: only rebuild this object when state changes, so components using
  // the context don't re-render for no reason.
  const value = useMemo<CartContextValue>(
    () => ({
      lines: state.lines,
      loaded: state.loaded,
      count: state.lines.reduce((sum, l) => sum + l.quantity, 0),
      subtotal: state.lines.reduce((sum, l) => sum + l.price * l.quantity, 0),
      addItem: (item) => dispatch({ type: "add", item }),
      setQuantity: (id, quantity) => dispatch({ type: "setQuantity", id, quantity }),
      removeItem: (id) => dispatch({ type: "remove", id }),
      clear: () => dispatch({ type: "clear" }),
    }),
    [state],
  );

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
