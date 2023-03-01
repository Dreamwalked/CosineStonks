import request from "../requestV2"
import Promise from "../PromiseV2";
const C0EPacketClickWindow = Java.type("net.minecraft.network.play.client.C0EPacketClickWindow")
const sendWindowClick = (windowId, slot, clickType, actionNumber = 0) => Client.sendPacket(new C0EPacketClickWindow(windowId ?? Player.getContainer().getWindowId(), slot, clickType ?? 0, 0, null, actionNumber))
let flipper = false;
let key;
let uuid;
let byte = [];
let commands = [];
let prices = [];
let bids = []
let items = [];
let tier = [];
let start = []
let blacklist = ["Belt", "Cloak", "Necklace", "Gauntlet"]
let minprofit = 7000000;
const m = 1000000;
register('command', (...args) => {
    if(args[0] == "key") {
        key = args[1];
        ChatLib.chat("[flipper] api key set to: "+key)
    }
    else if(args[0]  === "minprofit"){
        minprofit = args[1]
        ChtaLib.chat("[flipper] minprofit set to "+minprofit)
    }
    else{
        flipper = !flipper;
        ChatLib.chat(`§4CosineStonks ${flipper ? "§aEnabled" : "§cDisabled"}§b.`);
    }
}).setName("flipper");

register('chat', (apikey) => {
    key = apikey
    ChatLib.chat("[flipper] api key set to: "+key)
}).setCriteria("Your new API key is ${apikey}")

const userUUID = (username) => {
	return request({
		url: "https://api.mojang.com/users/profiles/minecraft/"+username,
		json: true
	}).then(data => {
		return data.id
	})
}
const getPlayerUUID = (player) => {Promise.all([userUUID(player)]).then((data) => {
    uuid = data[0];
}
)}

let send = false;
let itemName;
let startingbid;
register("postGuiRender", () => {
    const item = Player.getContainer().getItems()[13];
    if (flipper === true){
       //  ChatLib.chat(Player.getContainer().getItems()[38]?.getNBT())
    if (!Player.getContainer()) return;
    if (Player.getContainer().getName().includes("BIN Auction View")){
        item?.getLore()?.forEach(line => {
            if( ChatLib.removeFormatting(line)?.startsWith("Seller:")){
                let player = ChatLib.removeFormatting(line).replace(/Seller: |\[.*?\] /g, "")
                if (player.includes("Refreshing...") === false) {
                if (send === true){

                itemName = item.getName().removeFormatting()
                item.getLore()?.forEach(line => {
                    if (ChatLib.removeFormatting(line)?.startsWith("Buy it now:")) {
                        startingbid = parseInt(ChatLib.removeFormatting(line).replace(/Buy it now: |,| coins/g, ""))
                    }
                })
                console.log("item is "+itemName+" and price is "+startingbid)
                playerUUID = getPlayerUUID(player) 
                
                setTimeout(() => {
                    console.log("sent to "+uuid)
                    getPlayer(uuid)
                }, 300) 
                setTimeout(() => {
                    if (byte !== undefined && commands !== undefined && prices !== undefined && bids !== undefined && items !== undefined && tier !== undefined && start !== undefined){
                    if (byte.length === commands.length && commands.length === prices.length && prices.length === bids.length && bids.length === items.length && items.length === tier.length && tier.length === start.length){
                        ChatLib.chat("Found "+byte.length+" items")
                    for (let i = 0; i < commands.length; i++) {
                        if (parseInt(bids[i]) === 0) {
                            getPrice(byte[i], commands[i], prices[i], items[i], tier[i], start[i])
                            //ChatLib.chat(items[i]+" is not sold")
                        }
                        else{
                            //ChatLib.chat(items[i]+" is sold for "+bids[i])
                        }
                    }
                    byte.length = 0;
                    commands.length = 0;
                    prices.length = 0;
                    bids.length = 0;
                    items.length = 0;
                    tier.length = 0;
                    start.length = 0;
                }
                }
                }, 3100)
                send = false;
                 
                 send = false;
            }}}
        }) 
}
else{
    send = true;
}
}
})

register("chat", (ign, player) => {
    ChatLib.chat(new Message(
        new TextComponent("§2Sellers AH: Auction sold by "+player).setClick("run_command", "/ah "+player)
     ))
}).setCriteria("Co-op > ${ign}: ${player}")
let k=0;
const getPlayer = (player) =>{
    request({
      url: `https://api.hypixel.net/skyblock/auction?key=${key}&player=${player}`,
      json: true,
      headers: { 'User-Agent': 'Mozilla/5.0 (ChatTriggers)' }
    })
      .then((response) => {
        let auctions = response.auctions;
        auctions.forEach((auction) => {
            const item = auction.item_name.replace(/\u0027/g, "'").replace(/âœªâœªâœªâœªâœª/, "✪✪✪✪✪")
            console.log(item+" vs "+itemName)
            byte?.push(auction?.item_bytes?.data)
            prices?.push(auction.starting_bid)
            commands?.push(auction?.uuid)
            bids?.push(auction?.highest_bid_amount)
            items?.push(item)
            tier?.push(auction?.tier)
            start?.push(new Date(auction?.start))
        })
      })
      .catch((fail) => {
        ChatLib.chat('Didnt work! ' + JSON.stringify(fail));
      });
  }

const getPrice = (byte, command, bid, item, tier, start) => {
    request({
        url: 'https://sky.coflnet.com/api/price/nbt',
        json: true,
        method: 'POST',
        headers: { 'User-Agent': 'Mozilla/5.0 (ChatTriggers)' },
        body: {
            "chestName": "",
            "fullInventoryNbt": byte,
            "settings": {
                "fields": [
                    [
                        "NONE"
                    ]
                ]
            }
        },
    })
        .then((response) => {
        if(!hype){
            let data = JSON.stringify(response);
            console.log(data);
            data = JSON.parse(data);
            const median = data[0].median
            if(median-bid >= minprofit && median*0.88 >= bid){
                flipMessage(item.replace(/âœªâœªâœªâœª/g, "✪✪✪✪✪").replace(/âœ¦/, "✦"), tier, bid, median, start, command)
                blacklist.forEach(blocked => {
                    if(item.includes(blocked)) return ChatLib.chat("§eItem was blacklisted, not opening")
                })
                ChatLib.say("/viewauction "+command)
            }}
            else{
                let data = JSON.stringify(response);
                console.log(data);
                data = JSON.parse(data);
                const median = data[0].median
                if(median-bid>=1){
                    return command;
                }
            }
        })
        .catch((fail) => {
            ChatLib.chat('Didnt work! ' + JSON.stringify(fail));
        });
}

const flipMessage = (item, rarity, bid, target, start, command) => {
    const difference = Date.now() - start.getTime();1
    const bed = (difference <= 20000) ? ` &r Bed ${Math.round(difference/1000)}s` : "";
    const colorCode = getRarityColor(rarity);
    ChatLib.chat(new Message(
        new TextComponent(`&r${target} \nCosineStonks: ${colorCode}${item} &b${bid} -> ${target}&r ✥${bed}`).setClick("run_command", `/viewauction ${command}`)
     ))
}

const getRarityColor = (rarity) => {
    switch (rarity.toLowerCase()) {
      case 'common':
        return '§f'; // white
      case 'uncommon':
        return '§a'; // green
      case 'rare':
        return '§9'; // blue
      case 'epic':
        return '§5'; // purple
      case 'legendary':
        return '§6'; // gold
      case 'mythic':
        return '§d'; // light purple/pink
      case 'supreme':
        return '§4'; // dark red
      case 'special':
      case 'very_special':
        return '§c'; // red
      case 'divine':
        return '§b'; // light blue
      default:
        return '§f'; // white (default)
    }
  };
  