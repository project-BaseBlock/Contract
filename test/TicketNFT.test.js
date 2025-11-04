const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TicketNFT", function () {
  const NAME = "BaseBlock Ticket";
  const SYMBOL = "BBT";
  const BASE = "https://example.com/meta/";

  let owner, user, another;
  let Ticket, nft;

  beforeEach(async () => {
    [owner, user, another] = await ethers.getSigners();
    Ticket = await ethers.getContractFactory("TicketNFT");
    // 생성자 인자 4개 (name, symbol, baseURI, initialOwner)
    nft = await Ticket.connect(owner).deploy(NAME, SYMBOL, BASE, owner.address);
    await nft.waitForDeployment();
  });

  it("deploys with correct params", async () => {
    expect(await nft.name()).to.equal(NAME);
    expect(await nft.symbol()).to.equal(SYMBOL);
  });

  it("only owner can mint", async () => {
    await expect(
      nft.connect(user).mintTicket(await user.getAddress(), 1, "a001")
    ).to.be.reverted; // Ownable revert (버전별 메시지 차이 있으니 넓게 체크)
  });

  it("mints and sets tokenURI under baseURI", async () => {
    const to = await user.getAddress();
    const tx = await nft.connect(owner).mintTicket(to, 10, "a001");
    const receipt = await tx.wait();

    // 여러 이벤트 중 TicketMinted만 골라서 사용 (Transfer 먼저 나올 수 있음)
    const tm = receipt.logs
      .map((l) => {
        try { return nft.interface.parseLog(l); } catch { return null; }
      })
      .filter(Boolean)
      .find((ev) => ev.name === "TicketMinted");

    expect(tm, "TicketMinted event not found").to.exist;
    const tokenId = tm.args.tokenId;

    expect(await nft.ownerOf(tokenId)).to.equal(to);

    // tokenURI()는 baseURI + 저장된 파일명("tokenId.json")을 합쳐서 반환되어야 함
    const uri = await nft.tokenURI(tokenId);
    expect(uri).to.equal(`${BASE}${tokenId}.json`);
  });

  it("prevents duplicate seat", async () => {
    const to = await user.getAddress();
    await nft.connect(owner).mintTicket(to, 99, "a050");
    await expect(
      nft.connect(owner).mintTicket(to, 99, "a050")
    ).to.be.revertedWith("Seat already minted");
  });

  it("allows different seat or different gameId", async () => {
    const to = await user.getAddress();
    await nft.connect(owner).mintTicket(to, 99, "a050");
    await nft.connect(owner).mintTicket(to, 99, "a051"); // 다른 좌석 OK
    await nft.connect(owner).mintTicket(to, 100, "a050"); // 다른 게임 OK
    expect(await nft.ownerOf(1)).to.equal(to);
    expect(await nft.ownerOf(2)).to.equal(to);
    expect(await nft.ownerOf(3)).to.equal(to);
  });

  it("owner can update baseURI", async () => {
    await nft.connect(owner).setBaseURI("https://new-cdn/");
    const tx = await nft
      .connect(owner)
      .mintTicket(await user.getAddress(), 1, "r001");
    const r = await tx.wait();

    const tm = r.logs
      .map((l) => { try { return nft.interface.parseLog(l); } catch { return null; } })
      .filter(Boolean)
      .find((ev) => ev.name === "TicketMinted");

    expect(tm, "TicketMinted event not found").to.exist;
    const tokenId = tm.args.tokenId;

    // baseURI 한 번만 붙었는지 확인
    const newUri = await nft.tokenURI(tokenId);
    expect(newUri).to.equal(`https://new-cdn/${tokenId}.json`);
  });
});
