export const business = {
  name: "PetCare",
  phone: "5542984112985",
  displayPhone: "(42) 98411-2985",
  address: "Atendimento para adoção responsável em Telêmaco Borba - PR",
  mapsQuery: "PetCare, Telêmaco Borba - PR",
  hours: "Atendimento mediante contato"
};

export function whatsappLink(message = "Olá! Gostaria de conhecer os pets disponíveis para adoção.") {
  return `https://wa.me/${business.phone}?text=${encodeURIComponent(message)}`;
}
