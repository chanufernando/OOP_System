// utils/ticketUtils.js
const generateTicketNumber = (configId, index) => {
  const timestamp = Date.now();
  return `TIX-${configId}-${timestamp}-${index}`;
};

const createInitialTickets = async (
  connection,
  configId,
  totalTickets,
  price = 10.0
) => {
  const values = [];
  const placeholders = [];

  for (let i = 0; i < totalTickets; i++) {
    const ticketNumber = generateTicketNumber(configId, i + 1);
    values.push(ticketNumber, "available", price, configId);
    placeholders.push("(?, ?, ?, ?)");
  }

  const query = `
      INSERT INTO tickets (ticket_number, status, price, configuration_id)
      VALUES ${placeholders.join(", ")}
    `;

  await connection.execute(query, values);
};

module.exports = {
  generateTicketNumber,
  createInitialTickets,
};
