export function formatClientType(clientType: string) {
  switch (clientType) {
    case "individual":
      return "Individual";
    case "limited_company":
      return "Limited Company";
    case "partnership":
      return "Partnership";
    default:
      return clientType;
  }
}