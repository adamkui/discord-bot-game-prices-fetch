const Discord = require('discord.js');
const client = new Discord.Client();
const prefix = "!";
const fetch = require('node-fetch');
let stores;

client.once('ready', () => console.log('Ready!'));
client.login(process.env.token);

client.on('message', message => {
	if (!message.content.startsWith(prefix) || message.author.bot) return;
  const args = message.content.slice(prefix.length).trim().split(' ');
  const command = args.shift().toLowerCase(); 

  switch(command){
    case "help":
      showHelp(message);
      break;
    case "pricebyname":
      checkPrice(args, message);
      break;
    case "pbn":
      checkPrice(args, message);
      break;     
    case "pricebyid":
      checkPriceId(args, message);
      break;
    case "pbi":
      checkPriceId(args, message);
      break;
    default:
      message.channel.send("Unknown command")
      break;
  }
});


//************ Functions ************

const showHelp = function (message) {
  message.channel.send({embed: {
    color: 3447003,
    author: {
      name: client.user.username,
      icon_url: client.user.avatarURL
    },
    title: `PriceCheckBot parancsok`,
    fields: [{name: "!help", value: "Segítség"}, {name: "!pricebyname or !pbn", value: "Játék / játék csomagok keresése név alapján. Eredménye: Játéknév + egyedi azonosító"}, {name: "!pricebyid or !pbi", value: "Játék árának lekérdezése, a játék egyedi ID-ja alapján."}],
    timestamp: new Date(),
    }
  });
}

const getStores = async function() {
  const baseUrl = "https://www.cheapshark.com/api/1.0/stores";
  stores = await fetch(baseUrl).then(res => res.json())
}

const checkPrice = async function (args, message){
  const baseUrl = "https://www.cheapshark.com/api/1.0/games?title=";
  const games = await fetch(`${baseUrl}${args}`)
    .then(res => res.json())
    .then(res => res.map(game => `${game.external} (id: ${game.gameID})`))
    .then(res => {
      let msg = res.length 
        ? `Szia ${message.author}, az alábbi játékokat találtam. Használd a '!pricebyid' parancsot, és írd mögé a játék ID-ját a konkrét ajánlatokért. \n\n${res.join("\n")}` 
        : `Szia ${message.author}, sajnos nem találtom játékokat ezzel a névvel.`;
      message.channel.send(msg);
    }
      
    )
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
      let countOfDeals = res.deals.length;

      //Send replies
      if (countOfDeals) {
        message.channel.send(`Szia ${message.author}, ${countOfDeals} ajánlatot találtam erre a játékra: ${title}. A legalacsonyabb ár ${cheapestPrice}(USD/EUR) a következőn: ${cheapestStoreName}. A részleteket lent találod:`);
        message.channel.send({embed: {
          color: 3447003,
          author: {
            name: client.user.username,
            icon_url: client.user.avatarURL
          },
          title: `Ajánlatok erre: ${title}`,
          fields: res.deals.map(deal => ({name: stores.filter(s => s.storeID == deal.storeID)[0].storeName, value: `Ár: ${parseFloat(deal.price)}(USD/EUR) --- [Link](http://www.cheapshark.com/redirect?dealID=${deal.dealID})`})),
          timestamp: new Date(),
        }});
        message.channel.send(`\nLink a legjobb ajánlathoz innen: ${cheapestStoreName} \nhttps://www.cheapshark.com/redirect?dealID=${dealID}`);
      } else {
        message.channel.send(`Szia ${message.author}, nem találtam ajánlatot találtam ezzel az ID-val.`);
      }
    })
}

