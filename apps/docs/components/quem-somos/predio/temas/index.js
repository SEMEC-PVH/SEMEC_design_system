// Temas dos andares da SEMFAZ: o que caracteriza cada setor.
//
// Cada tema exporta `{ planejar(ctx), construir(ctx) }` (ver escritorio.js):
// - planejar: na planta (pura). Reserva tiles (ctx.reservar), tira peças
//   genéricas (ctx.removerDecor) e registra objetos que ensinam (ctx.info).
//   Tiles protegidos (chegada, entrada, frente das estações) não podem ser
//   reservados; ctx.alcancavel() lista o que ficou inalcançável.
// - construir: na cena. Monta as peças (de preferência em ctx.lotes, um draw
//   call por material) e devolve { update(t, dt), dispose() } (opcionais).

import { terreo } from "./terreo";
import { receita } from "./receita";
import { financas } from "./financas";
import { orcamento } from "./orcamento";
import { planejamento } from "./planejamento";
import { tecnologia } from "./tecnologia";

export const TEMAS = { terreo, receita, financas, orcamento, planejamento, tecnologia };
