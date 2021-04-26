const Discord = require('discord.js');
const client = new Discord.Client();
const prefix = "!";
const fetch = require('node-fetch');
let stores;

console.log('Hello world!');

client.once('ready', () => console.log('Ready!'));
client.login(process.env.token);

client.on('message', message => {
	if (!message.content.startsWith(prefix) || message.author.bot) return;
  const args = message.content.slice(prefix.length).trim().split(' ');
  const command = args.shift().toLowerCase(); 

  switch(command){
    case "pricebyname":
      checkPrice(args, message);
      break;
    case "pricebyid":
      checkPriceId(args, message);
      break;
    default:
      message.channel.send("Unknown command")
      break;
  }
});


//************ Functions ************

const getStores = async function() {
  const baseUrl = "https://www.cheapshark.com/api/1.0/stores";
  stores = await fetch(baseUrl).then(res => res.json())
}

const checkPrice = async function (args, message){
  const baseUrl = "https://www.cheapshark.com/api/1.0/games?title=";
  const games = await fetch(`${baseUrl}${args}`)
    .then(res => res.json())
    .then(res => res.map(game => `${game.external} (id: ${game.gameID})`))
    .then(res => message.channel.send(`Szia ${message.author}, az alábbi játékokat találtam. Használd a '!pricebyid' parancsot, és írd mögé a játék ID-ját a konkrét ajánlatokért. \n\n${res.join("\n")}`))
}

const checkPriceId = async function (args, message){
  await getStores();
  const baseUrl = "https://www.cheapshark.com/api/1.0/games?id=";
  const deal = await fetch(`${baseUrl}${args}`)
    .then(res => res.json())
    .then(res => {
      let title = res.info.title;
      let cheapestPrice = res.deals.map(deal => parseFloat(deal.price))[0];
      let cheapestStoreId = res.deals.map(deal => deal.storeID)[0];
      let cheapestStoreName = stores.filter(store => store.storeID == cheapestStoreId)[0].storeName;
      let dealID = res.deals.map(deal => deal.dealID)[0];
      let saving = res.deals.map(deal => parseFloat(deal.savings).toFixed(2))[0];
      let summary = res.deals.map(deal => `${stores.filter(s => s.storeID == deal.storeID)[0].storeName}: ${parseFloat(deal.price)} -- [Link](http://www.cheapshark.com/redirect?dealID=${deal.dealID})`);

      //Send replies
      message.channel.send(`Szia ${message.author}, ${res.deals.length} ajánlatot találtam erre a játékra: ${title}. A legalacsonyabb ár ${cheapestPrice}(USD/EUR) a következőn: ${cheapestStoreName}. A részleteket lent találod:`);
      message.channel.send({embed: {
        color: 3447003,
        author: {
          name: client.user.username,
          icon_url: client.user.avatarURL
        },
        title: `Ajánlatok erre: ${title}`,
        fields: res.deals.map(deal => ({name: stores.filter(s => s.storeID == deal.storeID)[0].storeName, value: `Ár: ${parseFloat(deal.price)}(USD/EUR) --- [Link](http://www.cheapshark.com/redirect?dealID=${deal.dealID})`})),
        timestamp: new Date(),
      }
    });
    message.channel.send(`\nLink a legjobb ajánlathoz innen: ${cheapestStoreName} \nhttps://www.cheapshark.com/redirect?dealID=${dealID}`);

    })
}

