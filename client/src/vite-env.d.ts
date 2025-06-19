/// <reference types="vite/client" />

declare module "@assets/*" {
  const content: string;
  export default content;
}