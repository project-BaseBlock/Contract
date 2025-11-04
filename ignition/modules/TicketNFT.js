const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("TicketNFTModule", (m) => {
  const name = m.getParameter("name", "BaseBlock Ticket");
  const symbol = m.getParameter("symbol", "BBT");
  const baseURI = m.getParameter("baseURI", "https://example.com/meta/");
  const owner = m.getAccount(0);

  const ticket = m.contract("TicketNFT", [name, symbol, baseURI, owner]);

  return { ticket };
});
