# Firebase Regional Configuration

Este documento explica a configuração regional dos Firebase Cloud Functions no projeto.

## Configuração Regional

Todas as Firebase Cloud Functions neste projeto estão configuradas para executar na região `us-central1`. Esta configuração é aplicada em vários lugares:

### 1. Arquivos do Servidor (Firebase Functions)

**functions/src/index.ts**:
```typescript
// Set region for all functions
const FUNCTION_REGION = "us-central1";

export const helloWorld = functions.region(FUNCTION_REGION).https.onCall((data, context) => {
  // ...
});
```

**functions/src/superagent.ts**:
```typescript
// Define a região para as funções
const FUNCTION_REGION = "us-central1";

export const listAgents = functions.region(FUNCTION_REGION).https.onCall(async (data, context) => {
  // ...
});
```

### 2. Arquivos do Cliente (Next.js)

**app/lib/firebase.ts**:
```typescript
// Define the region for Firebase Functions (should match server-side)
const FUNCTION_REGION = "us-central1";
const functions = getFunctions(app, FUNCTION_REGION);
```

## Importância da Configuração Regional

A configuração regional é importante por várias razões:

1. **Latência**: Escolher uma região próxima aos seus usuários reduz a latência.
2. **Conformidade**: Algumas jurisdições exigem que os dados sejam processados em regiões específicas.
3. **Custos**: Diferentes regiões podem ter custos diferentes.
4. **Disponibilidade**: Diferentes regiões podem ter diferenças de disponibilidade de recursos.

## Alterando a Região

Se precisar alterar a região das funções, é necessário atualizar os três locais mencionados acima:

1. `FUNCTION_REGION` em functions/src/index.ts
2. `FUNCTION_REGION` em functions/src/superagent.ts
3. `FUNCTION_REGION` em app/lib/firebase.ts

Lembre-se de reimplantar as funções após alterar a região.

## Regiões Disponíveis

O Firebase Functions v2 suporta várias regiões ao redor do mundo. Algumas das regiões disponíveis são:

- `us-central1` (Iowa, EUA) - **Padrão**
- `us-east1` (Carolina do Sul, EUA)
- `us-east4` (Virgínia do Norte, EUA)
- `us-west1` (Oregon, EUA)
- `us-west2` (Los Angeles, EUA)
- `us-west3` (Salt Lake City, EUA)
- `us-west4` (Las Vegas, EUA)
- `northamerica-northeast1` (Montreal, Canadá)
- `southamerica-east1` (São Paulo, Brasil)
- `europe-west1` (Bélgica)
- `europe-west2` (Londres, Reino Unido)
- `europe-west3` (Frankfurt, Alemanha)
- `europe-west6` (Zurique, Suíça)
- `europe-central2` (Varsóvia, Polônia)
- `asia-east1` (Taiwan)
- `asia-east2` (Hong Kong)
- `asia-northeast1` (Tóquio, Japão)
- `asia-northeast2` (Osaka, Japão)
- `asia-northeast3` (Seul, Coreia do Sul)
- `asia-south1` (Mumbai, Índia)
- `asia-southeast1` (Singapura)
- `asia-southeast2` (Jacarta, Indonésia)
- `australia-southeast1` (Sydney, Austrália)

## Recomendações

Para este projeto, recomendamos utilizar a região `us-central1` como padrão, a menos que haja uma necessidade específica para alterar. Se os seus usuários estiverem majoritariamente no Brasil, considere utilizar `southamerica-east1` (São Paulo) para reduzir a latência.