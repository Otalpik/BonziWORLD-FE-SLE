const log = require("./log.js").log;
const Ban = require("./ban.js");
const Utils = require("./utils.js");
const io = require('./index.js').io;
const settings = require("./settings.json");
const sanitize = require('sanitize-html');

let roomsPublic = [];
let rooms = {};
let usersAll = [];

exports.beat = function() {
    io.on('connection', function(socket) {
        new User(socket);
    });
};

function checkRoomEmpty(room) {
    if (room.users.length != 0) return;

    log.info.log('debug', 'removeRoom', {
        room: room
    });

    let publicIndex = roomsPublic.indexOf(room.rid);
    if (publicIndex != -1)
        roomsPublic.splice(publicIndex, 1);
    
    room.deconstruct();
    delete rooms[room.rid];
    delete room;
}

class Room {
    constructor(rid, prefs) {
        this.rid = rid;
        this.prefs = prefs;
        this.users = [];
    }

    deconstruct() {
        try {
            this.users.forEach((user) => {
                user.disconnect();
            });
        } catch (e) {
            log.info.log('warn', 'roomDeconstruct', {
                e: e,
                thisCtx: this
            });
        }
        //delete this.rid;
        //delete this.prefs;
        //delete this.users;
    }

    isFull() {
        return this.users.length >= this.prefs.room_max;
    }

    join(user) {
        user.socket.join(this.rid);
        this.users.push(user);

        this.updateUser(user);
    }

    leave(user) {
        // HACK
        try {
            this.emit('leave', {
                 guid: user.guid
            });
     
            let userIndex = this.users.indexOf(user);
     
            if (userIndex == -1) return;
            this.users.splice(userIndex, 1);
     
            checkRoomEmpty(this);
        } catch(e) {
            log.info.log('warn', 'roomLeave', {
                e: e,
                thisCtx: this
            });
        }
    }

    updateUser(user) {
		this.emit('update', {
			guid: user.guid,
			userPublic: user.public
        });
    }

    getUsersPublic() {
        let usersPublic = {};
        this.users.forEach((user) => {
            usersPublic[user.guid] = user.public;
        });
        return usersPublic;
    }

    emit(cmd, data) {
		io.to(this.rid).emit(cmd, data);
    }
}

function newRoom(rid, prefs) {
    rooms[rid] = new Room(rid, prefs);
    log.info.log('debug', 'newRoom', {
        rid: rid
    });
}

var floodLimit = 0;
var floodRate = 20;
setInterval(function(){floodLimit = 0;}, 60000);

var namez = ["Emma","Olivia","Sophia","Ava","Isabella","Mia","Abigail","Emily","Charlotte","Harper","Madison","Amelia","Elizabeth","Sofia","Evelyn","Avery","Chloe","Ella","Grace","Victoria","Aubrey","Scarlett","Zoey","Addison","Lily","Lillian","Natalie","Hannah","Aria","Layla","Brooklyn","Alexa","Zoe","Penelope","Riley","Leah","Audrey","Savannah","Allison","Samantha","Nora","Skylar","Camila","Anna","Paisley","Ariana","Ellie","Aaliyah","Claire","Violet","Stella","Sadie","Mila","Gabriella","Lucy","Arianna","Kennedy","Sarah","Madelyn","Eleanor","Kaylee","Caroline","Hazel","Hailey","Genesis","Kylie","Autumn","Piper","Maya","Nevaeh","Serenity","Peyton","Mackenzie","Bella","Eva","Taylor","Naomi","Aubree","Aurora","Melanie","Lydia","Brianna","Ruby","Katherine","Ashley","Alexis","Alice","Cora","Julia","Madeline","Faith","Annabelle","Alyssa","Isabelle","Vivian","Gianna","Quinn","Clara","Reagan","Khloe","Alexandra","Hadley","Eliana","Sophie","London","Elena","Kimberly","Bailey","Maria","Luna","Willow","Jasmine","Kinsley","Valentina","Kayla","Delilah","Andrea","Natalia","Lauren","Morgan","Rylee","Sydney","Adalynn","Mary","Ximena","Jade","Liliana","Brielle","Ivy","Trinity","Josephine","Adalyn","Jocelyn","Emery","Adeline","Jordyn","Ariel","Everly","Lilly","Paige","Isla","Lyla","Makayla","Molly","Emilia","Mya","Kendall","Melody","Isabel","Brooke","Mckenzie","Nicole","Payton","Margaret","Mariah","Eden","Athena","Amy","Norah","Londyn","Valeria","Sara","Aliyah","Angelina","Gracie","Rose","Rachel","Juliana","Laila","Brooklynn","Valerie","Alina","Reese","Elise","Eliza","Alaina","Raelynn","Leilani","Catherine","Emerson","Cecilia","Genevieve","Daisy","Harmony","Vanessa","Adriana","Presley","Rebecca","Destiny","Hayden","Julianna","Michelle","Adelyn","Arabella","Summer","Callie","Kaitlyn","Ryleigh","Lila","Daniela","Arya","Alana","Esther","Finley","Gabrielle","Jessica","Charlie","Stephanie","Tessa","Makenzie","Ana","Amaya","Alexandria","Alivia","Nova","Anastasia","Iris","Marley","Fiona","Angela","Giselle","Kate","Alayna","Lola","Lucia","Juliette","Parker","Teagan","Sienna","Georgia","Hope","Cali","Vivienne","Izabella","Kinley","Daleyza","Kylee","Jayla","Katelyn","Juliet","Maggie","Dakota","Delaney","Brynlee","Keira","Camille","Leila","Mckenna","Aniyah","Noelle","Josie","Jennifer","Melissa","Gabriela","Allie","Eloise","Cassidy","Jacqueline","Brynn","Sawyer","Evangeline","Jordan","Paris","Olive","Ayla","Rosalie","Kali","Maci","Gemma","Lilliana","Raegan","Lena","Adelaide","Journey","Adelynn","Alessandra","Kenzie","Miranda","Haley","June","Harley","Charlee","Lucille","Talia","Skyler","Makenna","Phoebe","Jane","Lyric","Angel","Elaina","Adrianna","Ruth","Miriam","Diana","Mariana","Danielle","Jenna","Shelby","Nina","Madeleine","Elliana","Amina","Amiyah","Chelsea","Joanna","Jada","Lexi","Katie","Maddison","Fatima","Vera","Malia","Lilah","Madilyn","Amanda","Daniella","Alexia","Kathryn","Paislee","Selena","Laura","Annie","Nyla","Catalina","Kayleigh","Sloane","Kamila","Lia","Haven","Rowan","Ashlyn","Christina","Amber","Myla","Addilyn","Erin","Alison","Ainsley","Raelyn","Cadence","Kendra","Heidi","Kelsey","Nadia","Alondra","Cheyenne","Kaydence","Mikayla","River","Heaven","Arielle","Lana","Blakely","Sabrina","Kyla","Ada","Gracelyn","Allyson","Felicity","Kira","Briella","Kamryn","Adaline","Alicia","Ember","Aylin","Veronica","Esmeralda","Sage","Leslie","Aspen","Gia","Camilla","Ashlynn","Scarlet","Journee","Daphne","Bianca","Mckinley","Amira","Carmen","Kyleigh","Megan","Skye","Elsie","Kennedi","Averie","Carly","Rylie","Gracelynn","Mallory","Emersyn","Logan","Camryn","Annabella","Dylan","Elle","Kiara","Yaretzi","Ariella","Zara","April","Gwendolyn","Anaya","Baylee","Brinley","Sierra","Annalise","Tatum","Serena","Dahlia","Macy","Miracle","Madelynn","Briana","Freya","Macie","Helen","Bethany","Leia","Harlow","Blake","Jayleen","Angelica","Marilyn","Viviana","Francesca","Juniper","Carolina","Jazmin","Emely","Maliyah","Cataleya","Jillian","Joy","Abby","Malaysia","Nylah","Sarai","Evelynn","Nia","Zuri","Addyson","Aleah","Kaia","Bristol","Lorelei","Jazmine","Maeve","Alejandra","Justice","Julie","Marlee","Phoenix","Jimena","Emmalyn","Nayeli","Aleena","Brittany","Amara","Karina","Giuliana","Thea","Braelynn","Kassidy","Braelyn","Luciana","Aubrie","Janelle","Madisyn","Brylee","Leighton","Ryan","Amari","Eve","Millie","Kelly","Selah","Lacey","Willa","Haylee","Jaylah","Sylvia","Melany","Elisa","Elsa","Hattie","Raven","Holly","Aisha","Itzel","Kyra","Tiffany","Jayda","Michaela","Madilynn","Jamie","Celeste","Lilian","Remi","Priscilla","Jazlyn","Karen","Savanna","Zariah","Lauryn","Alanna","Kara","Karla","Cassandra","Ariah","Evie","Frances","Aileen","Lennon","Charley","Rosemary","Danna","Regina","Kaelyn","Virginia","Hanna","Rebekah","Alani","Edith","Liana","Charleigh","Gloria","Cameron","Colette","Kailey","Carter","Helena","Matilda","Imani","Bridget","Cynthia","Janiyah","Marissa","Johanna","Sasha","Kaliyah","Cecelia","Adelina","Jessa","Hayley","Julissa","Winter","Crystal","Kaylie","Bailee","Charli","Henley","Anya","Maia","Skyla","Liberty","Fernanda","Monica","Braylee","Dallas","Mariam","Marie","Beatrice","Hallie","Maryam","Angelique","Anne","Madalyn","Alayah","Annika","Greta","Lilyana","Kadence","Coraline","Lainey","Mabel","Lillie","Anika","Azalea","Dayana","Jaliyah","Addisyn","Emilee","Mira","Angie","Lilith","Mae","Meredith","Guadalupe","Emelia","Margot","Melina","Aniya","Alena","Myra","Elianna","Caitlyn","Jaelynn","Jaelyn","Demi","Mikaela","Tiana","Blair","Shiloh","Ariyah","Saylor","Caitlin","Lindsey","Oakley","Alia","Everleigh","Ivanna","Miah","Emmy","Jessie","Anahi","Kaylin","Ansley","Annabel","Remington","Kora","Maisie","Nathalie","Emory","Karsyn","Pearl","Irene","Kimber","Rosa","Lylah","Magnolia","Samara","Elliot","Renata","Galilea","Kensley","Kiera","Whitney","Amelie","Siena","Bria","Laney","Perla","Tatiana","Zelda","Jaycee","Kori","Montserrat","Lorelai","Adele","Elyse","Katelynn","Kynlee","Marina","Jayden","Kailyn","Avah","Kenley","Aviana","Armani","Dulce","Alaia","Teresa","Natasha","Milani","Amirah","Breanna","Linda","Tenley","Sutton","Elaine","Elliott","Aliza","Kenna","Meadow","Alyson","Rory","Milana","Erica","Esme","Leona","Joselyn","Madalynn","Alma","Chanel","Myah","Karter","Zahra","Audrina","Ariya","Jemma","Eileen","Kallie","Milan","Emmalynn","Lailah","Sloan","Clarissa","Karlee","Laylah","Amiya","Collins","Ellen","Hadassah","Danica","Jaylene","Averi","Reyna","Saige","Wren","Lexie","Dorothy","Lilianna","Monroe","Aryanna","Elisabeth","Ivory","Liv","Janessa","Jaylynn","Livia","Rayna","Alaya","Malaya","Cara","Erika","Amani","Clare","Addilynn","Roselyn","Corinne","Paola","Jolene","Anabelle","Aliana","Lea","Mara","Lennox","Claudia","Kristina","Jaylee","Kaylynn","Zariyah","Gwen","Kinslee","Avianna","Lisa","Raquel","Jolie","Carolyn","Courtney","Penny","Royal","Alannah","Ciara","Chaya","Kassandra","Milena","Mina","Noa","Leanna","Zoie","Ariadne","Monserrat","Nola","Carlee","Isabela","Jazlynn","Kairi","Laurel","Sky","Rosie","Arely","Aubrielle","Kenia","Noemi","Scarlette","Farrah","Leyla","Amia","Bryanna","Naya","Wynter","Hunter","Katalina","Taliyah","Amaris","Emerie","Martha","Thalia","Christine","Estrella","Brenna","Milania","Salma","Lillianna","Marjorie","Shayla","Zendaya","Aurelia","Brenda","Julieta","Adilynn","Deborah","Keyla","Patricia","Emmeline","Hadlee","Giovanna","Kailee","Desiree","Casey","Karlie","Khaleesi","Lara","Tori","Clementine","Nancy","Simone","Ayleen","Estelle","Celine","Madyson","Zaniyah","Adley","Amalia","Paityn","Kathleen","Sandra","Lizbeth","Maleah","Micah","Aryana","Hailee","Aiyana","Joyce","Ryann","Caylee","Kalani","Marisol","Nathaly","Briar","Holland","Lindsay","Remy","Adrienne","Azariah","Harlee","Dana","Frida","Marianna","Yamileth","Chana","Kaya","Lina","Celia","Analia","Hana","Jayde","Joslyn","Romina","Anabella","Barbara","Bryleigh","Emilie","Nathalia","Ally","Evalyn","Bonnie","Zaria","Carla","Estella","Kailani","Rivka","Rylan","Paulina","Kayden","Giana","Yareli","Kaiya","Sariah","Avalynn","Jasmin","Aya","Jewel","Kristen","Paula","Astrid","Jordynn","Kenya","Ann","Annalee","Kai","Kiley","Marleigh","Julianne","Zion","Emmaline","Nataly","Aminah","Amya","Iliana","Jaida","Paloma","Asia","Louisa","Sarahi","Tara","Andi","Arden","Dalary","Aimee","Alisson","Halle","Aitana","Landry","Alisha","Elin","Maliah","Belen","Briley","Raina","Vienna","Esperanza","Judith","Faye","Susan","Aliya","Aranza","Yasmin","Jaylin","Kyndall","Saniyah","Wendy","Yaritza","Azaria","Kaelynn","Neriah","Zainab","Alissa","Cherish","Dixie","Veda","Nala","Tabitha","Cordelia","Ellison","Meilani","Angeline","Reina","Tegan","Hadleigh","Harmoni","Kimora","Ingrid","Lilia","Luz","Aislinn","America","Ellis","Elora","Heather","Natalee","Miya","Heavenly","Jenny","Aubriella","Emmalee","Kensington","Kiana","Lilyanna","Tinley","Ophelia","Moriah","Sharon","Charlize","Abril","Avalyn","Mariyah","Taya","Ireland","Lyra","Noor","Sariyah","Giavanna","Stevie","Rhea","Zaylee","Denise","Frankie","Janiya","Jocelynn","Libby","Aubrianna","Kaitlynn","Princess","Sidney","Alianna","Mollie","Aadhya","Janae","Mattie","Tinsley","Aliah","Ari","Aubri","Kaidence","Danika","Jana","Mavis","Mercy","Antonia","India","Miley","Raylee","Antonella","Regan","Robin","Abrielle","Akira","Ayva","Cambria","Dani","Devyn","Mckayla","Rayne","Alyvia","Diamond","Abbigail","Diya","Poppy","Anais","Anniston","Dalia","Alisa","Ayana","Ellery","Addalyn","Charleston","Amora","Ellianna","Samiyah","Mylah","Amayah","Carlie","Robyn","Alaysia","Harleigh","Kaleigh","Temperance","Belle","Chandler","Cindy","Elina","Kaylani","Maddie","Shannon","Araceli","Audriana","Taryn","Macey","Londynn","Tamia","Bayleigh","Carina","Evalynn","Promise","Ayanna","Sonia","August","Austyn","Emmie","Etta","Ramona","Joelle","Paisleigh","Treasure","Aanya","Berkley","Everlee","Louise","Vada","Vivien","Renee","Meghan","Pyper","Patience","Spencer","Gwyneth","Kasey","Mercedes","Ailyn","Carleigh","Karleigh","Neveah","Rilynn","Saanvi","Sailor","Cristina","Honesty","Magdalena","Marian","Maylee","Carley","Scout","Maxine","Reign","Kourtney","Lesly","Taraji","Maren","Opal","Jurnee","Keily","Riya","Jubilee","Kylah","Tess","Rosalee","Addie","Adela","Fallon","Itzayana","Natalya","Adalee","Campbell","Krystal","Luisa","Makena","Samira","Micaela","Rosalyn","Adilene","Jenesis","Kailynn","Kelsie","Sally","Selina","Sherlyn","Whitley","Bree","Maisy","Marlowe","Violeta","Xiomara","Aubriana","Addalynn","Calliope","Kataleya","Royalty","Izabelle","Kamilah","Adilyn","Aleigha","Gracyn","Katerina","Larissa","Loretta","Sunny","Audrianna","Baylor","Blaire","Brynleigh","Elodie","Katrina","Novalee","Addelyn","Dalilah","Davina","Florence","Kaleah","Marlene","Selene","Alessia","Bryn","Della","Karma","Abbie","Cecily","Drew","Sylvie","Ila","Kamille","Milah","Tia","Winnie","Annelise","Beatrix","Emani","Lillyanna","Theresa","Kalia","Kaylen","Lillyana","Malayah","Deanna","Jacquelyn","Kinlee","Maritza","Marlie","Noel","Ailani","Amiah","Alora","Ezra","Stacy","Valery","Kinzley","Leela","Lianna","Giada","Raya","Seraphina","Violette","Brynley","Charity","Geneva","Tyler","Bexley","Caydence","Elayna","Preslee","Elia","Haleigh","Annabeth","Ashtyn","Coral","Soraya","Yara","Destinee","Kaley","Sanaa","Dania","Denver","Egypt","Janice","Mika","Anayah","Delia","Malani","Vivianna","Anneliese","Maryjane","Nahla","Nellie","Raylynn","Aliyana","Eisley","Estefania","Jovie","Karissa","Leilah","Miyah","Emerald","Karis","Kaycee","Leena","Brisa","Caleigh","Kendal","Belinda","Cassie","Lorena","Aiyanna","Audra","Britney","Kamiyah","Kaylyn","Susanna","Agnes","Ashton","Christiana","Mayra","Shea","Tianna","Ali","Margo","Nalani","Nya","Rita","Viola","Laniyah","Nyomi","Vida","Betty","Milagros","Skylynn","Alex","Haylie","Karli","Meera","Rylynn","Isabell","Aida","Bellamy","Bentley","Blessing","Gisselle","Ivana","Karmen","Kinleigh","Rachael","Kendyl","Malak","Shirley","Aarya","Irie","Maite","Roslyn","Yesenia","Asha","Harriet","Hayleigh","Kacey","Rebeca","Samiya","Clover","Karley","Kyrie","Lilyann","Reece","Roxanne","Annaleigh","Annaliese","Carson","Kayleen","Khadija","Linnea","Malka","Tamara","Toni","Annette","Brinlee","Guinevere","Luella","Palmer","Rihanna","Rubi","Saniya","Sarina","Cailyn","Colbie","Emalyn","Evelina","Kaitlin","Karly","Katarina","Persephone","Vayda","Jaleah","Jazmyn","Kyndal","Leilany","Petra","Ananya","Araya","Audree","Brayleigh","Celina","Flora","Mayah","Octavia","Zoya","Arantza","Farah","Jakayla","Kinsey","Capri","Emiliana","Shanaya","Shay","Sofie","Yazmin","Arlene","Finnley","Grecia","Jacey","Marcella","Melinda","Priya","Skylah","Zayla","Calista","Isadora","Keila","Shaylee","Areli","Grayson","Jazelle","Silvia","Carsyn","Darcy","Elissa","Janie","Jazzlyn","Kiersten","Shreya","Emi","Nyah","Pamela","Tesla","Andie","Dayanna","Delanie","Kenleigh","Anabel","Izzabella","Yaretzy","Abbey","Carissa","Elinor","Keziah","Legacy","Sonya","Zahara","Alanah","Cheyanne","Haddie","Jaylyn","Leigha","Maribel","Nadine","Salem","Yuliana","Amaia","Damaris","Litzy","Azul","Gretchen","Journi","Mariella","Aadya","Annabell","Dariana","Donna","Emme","Ida","Judy","Layan","Aislynn","Darlene","Hailie","Jaclyn","Kya","Lucie","Nailah","Nayla","Saoirse","Shyla","Alba","Ariela","Dior","Lincoln","Oaklee","Tallulah","Yasmine","Dina","Essence","Jamiyah","Kamari","Lacy","Rayleigh","Rowyn","Tina","Winifred","Eleanora","Ema","Evangelina","Marin","Stephany","Ashanti","Elly","Emmerson","Leticia","Lidia","Nariah","Raleigh","Sanai","Tania","Zella","Aaleyah","Analise","Aniston","Carmella","Janet","Kenlee","Kynleigh","Maura","Naima","Bernadette","Chasity","Kynslee","Aracely","Austin","Ayesha","Beverly","Blythe","Kenzi","Mireya","Adalie","Avalon","Jael","Lakyn","Suri","Yoselin","Abbygail","Harlie","Kalea","Pepper","Yaneli","Ayah","Denisse","Queen","Vivianne","Aarna","Emeri","Yvette","Anita","Carli","Elana","Gwenyth","Jaylen","Kamiya","Lela","Marion","Quincy","Amyra","Anjali","Bridgette","Charlene","Eunice","Indie","Jersey","Rosalind","Maiya","Malina","Sapphire","Arianny","Ayvah","Kamilla","Korra","Constance","Estefany","Iyanna","Katy","Imogen","Jailyn","Kamora","Keilani","Prisha","Rosalina","Taliah","Aila","Alanis","Kacie","Kaila","Lucinda","Mariela","Shyanne","Ziva","Abriella","Amilia","Calla","Gisele","Jaqueline","Peighton","Symphony","Zaira","Cosette","Freyja","Kaci","Kierra","Lacie","Lizeth","Rosalia","Camden","Claira","Kinsleigh","Noah","Presleigh","Unique","Cambree","Harmonie","Hillary","Zora","Jiselle","Jude","Makiyah","Noelia","Taelyn","Avani","Dominique","Eleni","Emry","Heidy","Nori","Rosalynn","Serafina","Zaniya","Adina","Akshara","Chevelle","Karoline","Laken","Lillyann","Lori","Nikki","Rosemarie","Ryder","Zaynab","Annamarie","Aspyn","Dalila","Everley","Hartley","Ruthie","Wilhelmina","Yarely","Adalina","Arabelle","Cattleya","Jackeline","Jaslyn","Jaya","Kayley","Rowen","Tahlia","Alessa","Annistyn","Brigitte","Desirae","Lenora","Martina","Saphira","Sia","Zadie","Adyson","Althea","Ariane","Ariyana","Avril","Inara","Moira","Oona","Precious","Shania","Abrianna","Ariadna","Avarie","Georgina","Geraldine","Keegan","Laci","Maliya","Marceline","May","Sana","Zia","Amariah","Amyah","Arlette","Halo","Journie","Letty","Melia","Raeleigh","Renesmee","Roxana","Shae","Zola","Aubreigh","Izabel","Julietta","Kathy","Nicolette","Zuleyka","Adaleigh","Carrie","Daria","Darla","Isha","Kaylah","Liza","Miabella","Montana","Skylee","Alyse","Amethyst","Anaiah","Betsy","Camdyn","Christian","Deja","Khalia","Krista","Margarita","Salome","Sheila","Stormy","Susana","Yamilet","Anyla","Cambrie","Alyanna","Elliette","Emoni","Eryn","Jamya","Jordin","Karolina","Kenzlee","Rilee","Savanah","Alyna","Baila","Chelsey","Chyna","Honor","Kaisley","Keren","Lorraine","Nelly","Rhylee","Rileigh","Shayna","Taylin","Yulissa","Yuna","Cayla","Elisha","Gillian","Jamiya","Karmyn","Kirsten","Niya","Sahana","Sahara","Tayla","Waverly","Zinnia","Indigo","Josslyn","Liah","Melani","Reem","Santana","Siya","Teegan","Yasmeen","Ariyanna","Brylie","Channing","Cleo","Emmarie","Gitty","Janiah","Kloe","Melodie","Rhiannon","Samia","Taniyah","Yvonne","Amal","Amberly","Aviva","Carol","Georgiana","Isis","Jianna","Joslynn","Kingsley","Margaux","Mazie","Payten","Raniyah","Samaya","Zarah","Aiza","Aleyda","Arleth","Blanca","Brookelynn","Cielo","Elouise","Emberly","Jalayah","Justyce","Kayli","Kenzley","Leanne","Makenzi","Mileena","Navy","Nechama","Nila","Ameera","Anisa","Arwen","Dianna","Edie","Hensley","Ivey","Kinzlee","Laniya","Magdalene","Marielle","Maryann","Tala","Taytum","Abigale","Cori","Hudson","Jaylani","Jessalyn","Kari","Lucero","Oakleigh","Paizley","Rori","Xitlali","Ashleigh","Brea","Colleen","Graciela","Klara","Aleksandra","Aleyna","Ashly","Asiya","Carmela","Echo","Gentry","Iyla","Jaina","Kalina","Laiyah","Mariel","Nichole","Sanaya","Shoshana","Tiara","Viktoria","Abygail","Adalia","Aislyn","Ester","Navya","Soleil","Vaida","Armoni","Brittney","Candice","Cooper","Darby","Emalee","Kianna","Maelynn","Novah","Tanvi","Zaina","Chiara","Cierra","Devin","Finleigh","Jadyn","Journei","Katia","Khloee","Kristin","Laylani","Violetta","Adleigh","Annalisa","Berkeley","Brandi","Ever","Jaslynn","Kamdyn","Layna","Lois","Love","Abigayle","Adalynne","Braylynn","Faigy","Fatimah","Jaiden","Khadijah","Loren","Mona","Niyah","Reya","Taelynn","Aleeah","Aleyah","Emberlyn","Emelyn","Hollis","Italia","Johana","Kaliah","Lynlee","Marisa","Yolanda","Zayda","Annmarie","Arayah","Aryah","Beatriz","Emberlynn","Jacelyn","Jamila","Juana","Mariajose","Maycee","Sandy","Yusra","Aditi","Artemis","Ashlee","Bennett","Coralie","Elyssa","Jolee","Maelyn","Rocio","Roselynn","Safa","Shaniya","Sumaya","Tanya","Yael","Abagail","Annalynn","Arie","Avia","Daleysa","Deasia","Iman","Jacie","Keeley","Korie","Kyah","Lettie","Marcela","Maylin","Memphis","Myka","Talya","Valencia","Vicky","Acacia","Brighton","Hafsa","Kennadi","Laina","Mackenna","Makinley","Marli","Oriana","Raelee","Rhyan","Rochel","Dora","Gina","Jaycie","Justine","Kalli","Kiyah","Laikyn","Lanie","Lluvia","Monique","Paizlee","Rania","Stacey","Yana","Analeah","Cristal","Fabiola","Irelynn","Iyana","Marianne","Angely","Beckett","Elysia","Italy","Joan","Josselyn","Lakelyn","Leen","Lula","Lux","Makaylah","Malena","Mariya","Merida","Mirabelle","Trisha","Aminata","Anylah","Aoife","Aveline","Dawn","Ela","Iva","Keely","Kerrigan","Laya","Raizy","Veronika","Alonna","Ansleigh","Avigail","Dream","Evan","Ines","Ira","Kavya","Lane","Loyalty","Nour","Ripley","Aeris","Afton","Arionna","Brystol","Caelyn","Elli","Emmaleigh","Estela","Inaya","Irina","Jeanette","Khali","Liyah","Lynette","Marwa","Naila","Stefany","Allisson","Alyana","Billie","Caliyah","Dasha","Harleen","Jaidyn","Janelly","Jiya","Joanne","Joey","Lailani","Lesley","Maddilyn","Paulette","Roxanna","Sabine","Sydnee","Xochitl","Zarina","Zyla","Amerie","Aura","Chava","Jaci","Josefina","Juanita","Kyler","Naia","Rachelle","Rae","Rylin","Sabina","Analee","Audrie","Citlali","Dafne","Devorah","Gracen","Hayven","Jackie","Jacklyn","Kelis","Nikita","Noella","Rain","Susie","Taylee","Terra","Xena","Amaria","Asma","Brissa","Diane","Evelin","Malky","Olyvia","Pippa","Samaria","Star","Amarah","Aniah","Brynnlee","Elyana","Isobel","Janyla","Kaira","Kynzlee","Majesty","Mason","Sanvi","Adah","Anayeli","Avonlea","Eiza","Gaia","Jannah","Jannat","Lourdes","Maddox","Maelee","Rosalinda","Sybil","Adalind","Alli","Amarie","Aubry","Avamarie","Candace","Destini","Eleanore","Emrie","Harlem","Janeth","Jenelle","Katharine","Layne","Liya","Mayte","Raine","Zaya","Aarohi","Arizona","Baileigh","Bracha","Greer","Josephina","Kodi","Lilyan","Melania","Milly","Nyasia","Reilly","Rian","Selma","Zariya","Ameena","Amor","Annaleah","Ellia","Jalaya","Jennah","Katheryn","Kiya","Maizy","Maryn","Murphy","Perry","Rayven","Sheyla","Sol","Teigan","Zyana","Avalee","Avary","Avaya","Brooklynne","Danae","Eliora","Haidyn","Hawa","Inaaya","Joann","Joi","Juno","Kimberlyn","Leora","Lupita","Makaila","Mari","Mildred","Odette","Triniti","Agatha","Alaiyah","Alexus","Analeigh","Aven","Charis","Doris","Ellington","Fern","Gizelle","Kamiah","Krisha","Laine","Manha","Saydee","Sonja","Taniya","Vianney","Adelle","Aja","Anissa","Annemarie","Aylah","Danni","Eila","Emeline","Eternity","Fallyn","Jhene","Kalynn","Kaniyah","Lillith","Mylee","Neva","Ria","Ryley","Sterling","Adelia","Adrian","Alayla","Batsheva","Breelyn","Calli","Coco","Emalynn","Giulia","Gladys","Hollie","Jailynn","Jalynn","Jazzlynn","Jia","Kalena","Kambree","Linley","Loralei","Marlow","Mckinlee","Millicent","Ramsey","Rebel","Shaniyah","Sinai","Timber","Tracy","Yaiza","Alijah","Alyza","Anisha","Braylin","Carys","Christy","Connie","Daenerys","Delylah","Flor","Glory","Ilana","Izel","Janna","Jasleen","Jazmyne","Kamya","Keiry","Kenzleigh","Kinzie","Leylani","Lynn","Taleah","Tamar","Zayna","Aaradhya","Ameerah","Arianne","Avelyn","Charly","Cienna","Emmi","Jasmyn","Kaydance","Kaydee","Larkin","Leann","Lexington","Milla","Yatziri","Yazaira","Addelynn","Anasofia","Ania","Anistyn","Annalia","Anvi","Calleigh","Emarie","Evolet","Hellen","Jaden","Jayne","Lillyan","Lotus","Marbella","Merritt","Roxy","Sariya","Sevyn","Taylynn","Theodora","Tilly","Zaida","Alyce","Aribella","Brigid","Bryce","Debora","Goldie","Kaylene","Mahogany","Mallorie","Marguerite","Mayla","Susannah","Toby","Tristan","Ainslee","Allegra","Ani","Antoinette","Avni","Britton","Corina","Divine","Joana","Kelsi","Linden","Lottie","Lucianna","Mindy","Priscila","Raylin","Ruhi","Samaira","Shaelyn","Shaina","Skarlett","Swara","Zooey","Ainara","Amiracle","Angelie","Annalyse","Anslee","Asiyah","Brianne","Brynnley","Devon","Ericka","Kalyn","Kenslee","Kristine","Lael","Laynie","Maizie","Marlo","Noelani","Pauline","Philomena","Rilyn","Rivky","Sahasra","Sherry","Suzanne","Adelynne","Aisley","Arantxa","Avaleigh","Brookelyn","Chanelle","Christianna","Edna","Elisheva","Emaan","Felicia","Giulianna","Harlyn","Jayleigh","Kaileigh","Kylynn","Landyn","Malinda","Norma","Preslie","Romy","Savana","Shyann","Storm","Yuri","Zakiyah","Alexi","Alona","Anaiya","Anaiyah","Briseida","Dasia","Draya","Emmarose","Gema","Hadassa","Jacelynn","Jayna","Jensen","Josey","Kenzington","Lilyanne","Liyana","Misha","Odessa","Skylin","Theia","Vianey","Yadira","Acelynn","Adara","Aliviah","Anderson","Asher","Avyanna","Azlynn","Berlin","Cayleigh","Evalina","Illiana","Jaslene","Jennie","Johannah","Kahlan","Kassie","Kenadee","Khylee","Klaire","Lyrik","Nirvana","Rahma","Randi","Shira","Adlee","Adria","Anja","Berklee","Blakeley","Coralee","Dakotah","Fatoumata","Halima","Indiana","Jamia","Jovi","Kennady","Kirra","Layah","Magaly","Mayar","Naiya","Naveah","Pia","Shaila","Shriya","Starr","Zipporah","Aaralyn","Aashvi","Abella","Abriana","Amyiah","Analiyah","Anastacia","Annalie","Annalyn","Brinkley","Easton","Eliyah","Haiden","Ily","Ivie","Janai","Janely","Jesslyn","Kyara","Lexy","Leyna","Maple","Marlena","Meara","Rylei","Saira","Saya","Skyy","Yocheved","Aleen","Aleeyah","Alysson","Ariannah","Ayden","Brook","Brynna","Cerenity","Ellyana","Emmersyn","Ensley","Karely","Kim","Kolbie","Kyrah","Leana","Mabry","Maleigha","Miller","Ravyn","Ridley","Ryanne","Sabella","Serene","Simran","Aalayah","Adella","Baylie","Bethel","Briseyda","Caitlynn","Collette","Desire","Grey","Isa","Isela","Ivette","Janaya","Jariyah","Jordana","Julieth","Keagan","Lexus","Lilli","Meagan","Nava","Nilah","Royale","Sequoia","Sullivan","Tillie","Tova","Venus","Yanely","Amaryllis","Aniylah","Becca","Carrington","Daliyah","Emilyn","Emsley","Eowyn","Gianni","Haya","Isley","Jamiah","Jenevieve","Jesiah","Kaily","Laurie","Maddisyn","Mandy","Meah","Nadya","Nataleigh","Paxton","Prudence","Rosabella","Rosario","Sade","Sedona","Zakiya","Abilene","Adia","Aly","Arissa","Blakelee","Briseis","Cailey","Chesney","Daniyah","Emmylou","Finlee","Ginger","Ilyana","Izabela","Jaime","Jalissa","Kaiyah","Kezia","Kylin","Kynnedi","Lovely","Maira","Melisa","Minnie","Niah","Nika","Payson","Rikki","Safiya","Tanner","Tayler","Vanellope","Yehudis","Yulianna","Adalyne","Alea","Analy","Anvika","Azalia","Aziyah","Bobbi","Brilee","Camellia","Damiyah","Elowyn","Elyza","Irma","Issabella","Jean","Kamaria","Kensie","Keyli","Khaliyah","Kristiana","Lenore","Liz","Luca","Melanny","Polina","Sakura","Story","Xyla","Yasmina","Zaniah","Adrianne","Alaynah","Amna","Auria","Dawson","Dayanara","Elani","Emmanuella","Emmery","Empress","Eris","Isra","Jailyne","Jariah","Joselin","Jules","Justina","Kameryn","Karol","Kymber","Lani","Maliha","Marigold","Marla","Reva","Rosanna","Tyra","Uma","Zoee","Alexandrea","Annsley","Aries","Asa","Blakelyn","Brandy","Chelsie","Citlaly","Daelyn","Delila","Destiney","Emaline","Huda","Irelyn","Jazleen","Joseline","Kaiden","Kalliope","Kynsley","Mattison","Ocean","Solana","Stormie","Aaliya","Adamaris","Alynna","Anali","Analisa","Angelia","Aralynn","Azlyn","Brileigh","Brilynn","Caia","Cathy","Dara","Edyn","Emmalin","Emree","Gracey","Harlynn","Harmonee","Ileana","Iona","Jayce","Jesse","Kailah","Katana","Kenadie","Lamya","Laynee","Lillee","Makiya","Makyla","Marilynn","Nahomy","Naomy","Nariyah","Neve","Scotlyn","Yitty","Ysabella","Zamiyah","Zaylah","Adamari","Ahana","Aizah","Aleia","Alliyah","Andromeda","Avayah","Ayelen","Birdie","Brie","Bryana","Cathryn","Devora","Francis","Jaela","Josette","Karson","Kenadi","Lavinia","Liesel","Luci","Malorie","Manuela","Melannie","Rena","Rina","Rya","Sury","Therese","Tirzah","Wyatt","Ambar","Ameya","Auden","Brynlie","Catarina","Chase","Chevy","Citlalli","Crimson","Daniya","Denali","Elizabella","Emberlee","Eviana","Giulietta","Haisley","Jaydah","Kaylei","Kiah","Kimberlee","Landrie","Lillia","Lyanna","Lynnlee","Macyn","Malaika","Marlen","Maycie","Paetyn","Sama","Saraya","Shaindy","Vania","Zahraa","Adaly","Adira","Adison","Ahuva","Alise","Aliyanna","Alize","Austen","Britany","Caidence","Cameryn","Cassia","Dia","Elanor","Elliotte","Estefani","Evelynne","Evy","Harbor","Inez","Jessi","Kaidyn","Kensi","Kensleigh","Khole","Leeann","Lindy","Lora","Maddyn","Madelyne","Madisen","Maja","Makynlee","Michele","Mirabella","Nalah","Nell","Philippa","Railynn","Rayan","Razan","Samiah","Serina","Skylyn","Suzanna","Yessenia","Zofia","Aiden","Alaska","Alya","Analiah","Arrow","Arsema","Brailynn","Christa","Dinah","Emorie","Hanan","Havyn","Hiba","Iqra","Izabell","Kambrie","Kami","Karrington","Khloey","Kitana","Kyle","Lamar","Lavender","Leyah","Lizzie","Maylani","Natali","Navaeh","Roberta","Safia","Tatyana","Verity","Wednesday","Winry","Xenia","Zamira","Ailin","Alaura","Aleida","Alycia","Amairany","Anamaria","Arina","Ayra","Azeneth","Bellarose","Brinleigh","Brooklin","Brystal","Cedar","Danya","Ellah","Emori","Esmae","Haniya","Henrietta","Israel","Jackelyn","Janylah","Jenessa","Kendyll","Klarissa","Kylar","Laiken","Lakynn","Lizette","Lulu","Makynzie","Marisela","Mayzie","Mckenzi","Myracle","Neela","Nella","Olga","Porter","Rylen","Snow","Taylen","Amila","Arleen","Azari","Bay","Becky","Berenice","Cailynn","Cate","Chloee","Cianna","Corrine","Daylin","Delainey","Delphine","Deonna","Divya","Eman","Esmee","Fabiana","Ishani","Jaeda","Jayme","Jaymie","Julisa","Kalie","Kalista","Keisha","Kyliee","Levi","Lili","Malea","Markayla","Miliana","Nahomi","Nicolle","Oaklie","Ofelia","Rochelle","Samya","Sephora","Silvana","Tylee","Aariyah","Aliannah","Aulani","Averee","Britta","Caliana","Ellena","Eloisa","Emmah","Hermione","Hosanna","Jahzara","Jewels","Joella","Kaniya","Kenzy","Lariah","Maricela","Nayomi","Oaklynn","Semaj","Shaelynn","Sicily","Sunshine","Tierra","Tristyn","Zena","Adelyne","Alaa","Allana","Aralyn","Ashlin","Bernice","Blayke","Breckyn","Brithany","Cailee","Callista","Ciana","Coralynn","Daiana","Ebony","Ina","Jaila","Jalisa","Jaziyah","Kaleigha","Korbyn","Layken","Layton","Leya","Liora","Mikah","Ollie","Raylan","Simona","Siobhan","Skai","Tenzin","Aislin","Angelyn","Anora","Avri","Ayat","Brantley","Cheryl","Chole","Esha","Ezri","Francine","Kambri","Leylah","Lisette","Marlei","Naira","Novaleigh","Oaklyn","Pandora","Raylen","Rosaleigh","Roxie","Sahar","Samarah","Samirah","Shakira","Talitha","Trinitee","Tyanna","Ziyah","Zylah"];

let userCommands = {
    "godmode": function(word) {
        let success = word == this.room.prefs.godword;
        if (success) this.private.runlevel = 3;
        log.info.log('debug', 'godmode', {
            guid: this.guid,
            success: success
        });
    },
    "sanitize": function() {
        let sanitizeTerms = ["false", "off", "disable", "disabled", "f", "no", "n"];
        let argsString = Utils.argsString(arguments);
        this.private.sanitize = !sanitizeTerms.includes(argsString.toLowerCase());
    },
    "joke": function() {
        this.room.emit("joke", {
            guid: this.guid,
            rng: Math.random()
        });
		console.log(this.public.name + ' tells a joke. (ip: ' + this.getIp() + ')');
    },
    "youtube": function(vidRaw) {
        var vid = this.private.sanitize ? sanitize(vidRaw) : vidRaw;
        this.room.emit("youtube", {
            guid: this.guid,
            vid: vid
        });
		console.log(this.public.name + " plays a YouTube video: https://www.youtube.com/watch?v=" + vid + " (ip: " + this.getIp() + ")");
    },
    "color": function(color) {
        if (typeof color != "undefined") {
            if (settings.bonziColors.indexOf(color) == -1)
                return;
            
            this.public.color = color;
        } else {
            let bc = settings.bonziColors;
            this.public.color = bc[
                Math.floor(Math.random() * bc.length)
            ];
        }

        this.room.updateUser(this);
		console.log(this.public.name + ' changes the color to: ' + color + ' (ip: ' + this.getIp() + ')');
    },
    "pope": function() {
        this.public.color = "pope";
        this.room.updateUser(this);
		console.log(this.public.name + ' becomes a pope. (ip: ' + this.getIp() + ')');
    },
	"disconnect": function() {
		console.log(this.public.name + ' disconnected the server. (ip: ' + this.getIp() + ')');
        socket.disconnect();
    },
    "asshole": function() {
        this.room.emit("asshole", {
            guid: this.guid,
            target: sanitize(Utils.argsString(arguments))
        });
		console.log(this.public.name + ' calls ' + sanitize(Utils.argsString(arguments)) + ' an asshole! (ip: ' + this.getIp() + ')');
    },
    "triggered": "passthrough",
    "name": function() {
        let argsString = Utils.argsString(arguments);
        if (argsString.length > this.room.prefs.name_limit)
            return;

        let name = argsString || namez[Math.floor(Math.random()*namez.length)];
        this.public.name = this.private.sanitize ? sanitize(name) : name;
        this.room.updateUser(this);
		console.log(this.public.name + ' is now a new name. (ip: ' + this.getIp() + ')');
    },
    "pitch": function(pitch) {
        pitch = parseInt(pitch);

        if (isNaN(pitch)) return;

        this.public.pitch = Math.max(
            Math.min(
                parseInt(pitch),
                this.room.prefs.pitch.max
            ),
            this.room.prefs.pitch.min
        );

        this.room.updateUser(this);
		console.log(this.public.name + ' changes the pitch to: ' + pitch + ' (ip: ' + this.getIp() + ')');
    },
    "speed": function(speed) {
        speed = parseInt(speed);

        if (isNaN(speed)) return;

        this.public.speed = Math.max(
            Math.min(
                parseInt(speed),
                this.room.prefs.speed.max
            ),
            this.room.prefs.speed.min
        );
        
        this.room.updateUser(this);
		console.log(this.public.name + ' changes the speed to: ' + speed + ' (ip: ' + this.getIp() + ')');
    }
};


class User {
    constructor(socket) {
        this.guid = Utils.guidGen();
        this.socket = socket;

        // Handle ban
	    if (Ban.isBanned(this.getIp())) {
            Ban.handleBan(this.socket);
        }

        this.private = {
            login: false,
            sanitize: true,
            runlevel: 0
        };

        this.public = {
            color: settings.bonziColors[Math.floor(
                Math.random() * settings.bonziColors.length
            )]
        };

        log.access.log('info', 'connect', {
            guid: this.guid,
            ip: this.getIp()
        });

       this.socket.on('login', this.login.bind(this));
    }

    getIp() {
        return this.socket.request.connection.remoteAddress;
    }

    getPort() {
        return this.socket.handshake.address.port;
    }

    login(data) {
        if (typeof data != 'object') return; // Crash fix (issue #9)
        
        if (this.private.login) return;

		log.info.log('info', 'login', {
			guid: this.guid,
        });
        
        let rid = data.room;
        
		// Check if room was explicitly specified
		var roomSpecified = true;

		// If not, set room to public
		if ((typeof rid == "undefined") || (rid === "")) {
			rid = roomsPublic[Math.max(roomsPublic.length - 1, 0)];
			roomSpecified = false;
		}
		log.info.log('debug', 'roomSpecified', {
			guid: this.guid,
			roomSpecified: roomSpecified
        });
        
		// If private room
		if (roomSpecified) {
            if (sanitize(rid) != rid) {
                this.socket.emit("loginFail", {
                    reason: "nameMal"
                });
                return;
            }

			// If room does not yet exist
			if (typeof rooms[rid] == "undefined") {
				// Clone default settings
				var tmpPrefs = JSON.parse(JSON.stringify(settings.prefs.private));
				// Set owner
				tmpPrefs.owner = this.guid;
                newRoom(rid, tmpPrefs);
			}
			// If room is full, fail login
			else if (rooms[rid].isFull()) {
				log.info.log('debug', 'loginFail', {
					guid: this.guid,
					reason: "full"
				});
				return this.socket.emit("loginFail", {
					reason: "full"
				});
			}
		// If public room
		} else {
			// If room does not exist or is full, create new room
			if ((typeof rooms[rid] == "undefined") || rooms[rid].isFull()) {
				rid = Utils.guidGen();
				roomsPublic.push(rid);
				// Create room
				newRoom(rid, settings.prefs.public);
			}
        }
        
        this.room = rooms[rid];

        // Check name
		this.public.name = sanitize(data.name) || "User " + Math.random().toString(16).slice(-8);

		if (this.public.name.length > this.room.prefs.name_limit)
			return this.socket.emit("loginFail", {
				reason: "nameLength"
			});
        
		if (this.room.prefs.speed.default == "random")
			this.public.speed = Utils.randomRangeInt(
				this.room.prefs.speed.min,
				this.room.prefs.speed.max
			);
		else this.public.speed = this.room.prefs.speed.default;

		if (this.room.prefs.pitch.default == "random")
			this.public.pitch = Utils.randomRangeInt(
				this.room.prefs.pitch.min,
				this.room.prefs.pitch.max
			);
		else this.public.pitch = this.room.prefs.pitch.default;

        // Join room
        this.room.join(this);

        this.private.login = true;
        this.socket.removeAllListeners("login");

		// Send all user info
		this.socket.emit('updateAll', {
			usersPublic: this.room.getUsersPublic()
		});

		// Send room info
		this.socket.emit('room', {
			room: rid,
			isOwner: this.room.prefs.owner == this.guid,
			isPublic: roomsPublic.indexOf(rid) != -1
		});

        this.socket.on('talk', this.talk.bind(this));
        this.socket.on('command', this.command.bind(this));
        this.socket.on('disconnect', this.disconnect.bind(this));
		floodLimit++;
		console.log(floodLimit + "/"  + floodRate + " of floods.");
		if(floodLimit > floodRate){console.log(this.public.name + " is rate limited for flooding.");Ban.kick(this.getIp(),"You have been rate limited. It could be someone else who flooded the entire server. Wait for one minute and then join again. Your join limit is " + floodLimit + "/" + floodRate);}
		console.log(this.public.name + ' joined the server. (ip: ' + this.getIp() + ')');
    }

    talk(data) {
        if (typeof data != 'object') { // Crash fix (issue #9)
            data = {
                text: "HEY EVERYONE LOOK AT ME I'M TRYING TO SCREW WITH THE SERVER LMAO"
            };
        }

        log.info.log('debug', 'talk', {
            guid: this.guid,
            text: data.text
        });

        if (typeof data.text == "undefined")
            return;

        let text = this.private.sanitize ? sanitize(data.text) : data.text;
        if ((text.length <= this.room.prefs.char_limit) && (text.length > 0)) {
            this.room.emit('talk', {
                guid: this.guid,
                text: text
            });
        }
		console.log(this.public.name + ' said: ' + text + ' (ip: ' + this.getIp() + ')');
    }

    command(data) {
        if (typeof data != 'object') return; // Crash fix (issue #9)

        var command;
        var args;
        
        try {
            var list = data.list;
            command = list[0].toLowerCase();
            args = list.slice(1);
    
            log.info.log('debug', command, {
                guid: this.guid,
                args: args
            });

            if (this.private.runlevel >= (this.room.prefs.runlevel[command] || 0)) {
                let commandFunc = userCommands[command];
                if (commandFunc == "passthrough")
                    this.room.emit(command, {
                        "guid": this.guid
                    });
                else commandFunc.apply(this, args);
            } else
                this.socket.emit('commandFail', {
                    reason: "runlevel"
                });
        } catch(e) {
            log.info.log('debug', 'commandFail', {
                guid: this.guid,
                command: command,
                args: args,
                reason: "unknown",
                exception: e
            });
            this.socket.emit('commandFail', {
                reason: "unknown"
            });
        }
    }

    disconnect() {
		console.log(this.public.name + ' left the server. (ip: ' + this.getIp() + ')');
		let ip = "N/A";
		let port = "N/A";

		try {
			ip = this.getIp();
			port = this.getPort();
		} catch(e) { 
			log.info.log('warn', "exception", {
				guid: this.guid,
				exception: e
			});
		}

		log.access.log('info', 'disconnect', {
			guid: this.guid,
			ip: ip,
			port: port
		});
         
        this.socket.broadcast.emit('leave', {
            guid: this.guid
        });
        
        this.socket.removeAllListeners('talk');
        this.socket.removeAllListeners('command');
        this.socket.removeAllListeners('disconnect');

        this.room.leave(this);
    }
}
