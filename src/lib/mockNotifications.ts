export interface SaleNotification {
  id: string;
  customerName: string;
  amount: number;
  productName: string;
  method: 'M-Pesa' | 'eMola';
  createdAt: string;
  timeAgo: string;
}

// 100 Mozambican Customers
const mozCustomers = [
  'Flávia Mucavel', 'Mateus Cossa', 'Amina Patel', 'Celso Manjate', 'Inês Mabunda',
  'Edilson Tembe', 'Yara Chirindza', 'Nelson Macamo', 'Carla Sitoe', 'Gildo Nhaca',
  'Dulce Mondlane', 'Tomás Langa', 'Sheila Guambe', 'Hélder Chissano', 'Zaida Matusse',
  'Rui Cumbane', 'Samira Daudo', 'Paulo Machava', 'Joana Nhantumbo', 'Hermenegildo Zandamela',
  'Telma Vilanculos', 'Alberto Cuamba', 'Fátima Ibraimo', 'Osvaldo Bila', 'Tânia Macuácua',
  'Dércio Tivane', 'Eunice Malauene', 'Belmiro Chiconela', 'Sandra Mapote', 'Leandro Simbine',
  'Nércia Mahumane', 'Arnaldo Munguambe', 'Cláudia Pelembe', 'Vasco Mabote', 'Anabela Guibunda',
  'Faizal Carimo', 'Milagrosa Chiziane', 'Stélio Gujral', 'Benilde Nhantumbo', 'Ivaldo Chongo',
  'Marta Muianga', 'Edgar Nhamposse', 'Lurdes Uamusse', 'Célio Tamele', 'Benvinda Mondlane',
  'Danilo Macaringue', 'Zuraida Cassamo', 'Ernesto Matusse', 'Ivone Chivambo', 'Bruno Manhique',
  'Débora Macamo', 'Filipe Nhaca', 'Gisela Sitoe', 'Hélder Mavie', 'Isabel Tembane',
  'Júlio Chissico', 'Kátia Cossa', 'Lázaro Mabjaia', 'Miriam Patel', 'Noémia Guambe',
  'Orlando Chongo', 'Patrícia Bila', 'Quitéria Macuácua', 'Rogério Tivane', 'Sónia Manjate',
  'Tito Tembe', 'Úrsula Langa', 'Valdemar Cumbane', 'Wanda Mondlane', 'Xavier Chiconela',
  'Yolanda Simbine', 'Zacarias Malauene', 'Alcinda Munguambe', 'Braulio Pelembe', 'Cecília Mabote',
  'Dário Guibunda', 'Eliana Chiziane', 'Francisco Gujral', 'Glória Nhantumbo', 'Humberto Chongo',
  'Isaura Muianga', 'Jaimito Nhamposse', 'Kélvia Uamusse', 'Luciano Tamele', 'Madalena Mondlane',
  'Nataniel Macaringue', 'Olga Cassamo', 'Pascoal Matusse', 'Queila Chivambo', 'Rodolfo Manhique',
  'Suraya Macamo', 'Tiago Nhaca', 'Ulica Sitoe', 'Vicente Mavie', 'Wilson Tembane',
  'Ximena Chissico', 'Yuran Cossa', 'Zulmira Mabjaia', 'Álvaro Patel', 'Beatriz Guambe'
];

const products = [
  'Método Renda Digital 197 MT',
  'Pack Tráfego Turbo MZN',
  'E-book Vendas Automáticas',
  'Comunidade VIP Otterfy',
  'Template Loja Express Moz',
  'Guia Afiliados de Sucesso',
  'Mini-Curso Criativos que Vendem',
  'Scripts de Conversão WhatsApp'
];

export const NOTIFICATIONS_100: SaleNotification[] = mozCustomers.map((name, index) => {
  // Realistic timestamps for today
  const minutesAgo = Math.floor(Math.pow(index, 1.4) * 1.5) + 1;
  const date = new Date(Date.now() - minutesAgo * 60 * 1000);

  let timeAgo = 'agora';
  if (minutesAgo < 60) {
    timeAgo = `há ${minutesAgo}m`;
  } else if (minutesAgo < 1440) {
    const hours = Math.floor(minutesAgo / 60);
    timeAgo = `há ${hours}h`;
  } else {
    timeAgo = 'ontem';
  }

  return {
    id: `sale-197-${index + 1}`,
    customerName: name,
    amount: 197, // Exactly 197 MZN
    productName: products[index % products.length],
    method: index % 2 === 0 ? 'M-Pesa' : 'eMola',
    createdAt: date.toISOString(),
    timeAgo,
  };
});
