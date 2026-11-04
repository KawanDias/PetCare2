import { database } from './firebase';
import { ref, get, set } from 'firebase/database';
// Se você já tiver os dados no mockData, pode importá-los:
// import { initialPets } from './mockData';

export async function seedDatabaseOnStartup() {
  try {
    const petsRef = ref(database, 'pets');
    const snapshot = await get(petsRef);

    // Se o banco estiver vazio na nuvem/VM, ele "monta" a estrutura inicial automaticamente
    if (!snapshot.exists()) {
      console.log('🔄 Banco vazio detectado na VM. Montando dados iniciais...');

      const dadosIniciais = {
        pets: {
          "pet-1": {
            nome: "Athena",
            especie: "Cachorro",
            idade: "2 anos",
            porte: "Médio",
            descricao: "Cadela dócil e amigável, resgatada recentemente.",
            fotoUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1",
            status: "Disponível"
          },
          "pet-2": {
            nome: "Lulucia",
            especie: "Gato",
            idade: "1 ano",
            porte: "Pequeno",
            descricao: "Gatinha carinhosa que adora sol.",
            fotoUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba",
            status: "Disponível"
          }
        },
        solicitacoes: {} // Inicializa o nó de solicitações vazio
      };

      await set(ref(database), dadosIniciais);
      console.log('✅ Banco montado e populado com sucesso na VM!');
    } else {
      console.log('ℹ️ O banco de dados já possui registros estruturados.');
    }
  } catch (error) {
    console.error('❌ Erro ao executar o script de montagem do banco:', error);
  }
}