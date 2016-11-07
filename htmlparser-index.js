const request = require('request');
const htmlparser = require("htmlparser");
const co = require('co');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const program = require('commander');

program
    .option('--doing')
    .option('--done')
    .option('--region [region]')
    .option('--area [area]')
    .parse(process.argv);

const region = program.region || '8';
const area = program.area || '35';

if(program.doing) {
    doing();
} else if(program.done) {
    done();
}

function do_parse_html($in) {
    let html = $in.html;
    let keyword = $in.keyword;
    let house_list = $in.house_list;

    var handler = new htmlparser.DefaultHandler(function (error, dom) {
        if(error){

        } else {
            //console.log('dom:', dom);
        }
    });
    var parser = new htmlparser.Parser(handler);
    parser.parseComplete(html);

    //console.log(handler.dom);

    function get_data(children) {
        for(let e of children) {
            if(e.raw === keyword) {
                house_list.push(e);
            } else if(e.children){
                get_data(e.children);
            }
        }
    }

    get_data(handler.dom);
}

function done() {
    let urls = [];
    console.log('region:', region);
    switch(region) {
    case '8':
        switch(area) {
        case '35':
            for(let i = 1; i <= 10; i++) {
                urls.push(`http://bj.lianjia.com/chengjiao/hu1pg${i}a1c1111027375904rs%E5%8C%97%E8%A1%97%E5%AE%B6%E5%9B%AD/`);
            }
            break;
        }
        break;

    case '6':
        switch(area) {
        case '60':
            for(let i = 1; i <= 6; i++) {
                urls.push(`http://bj.lianjia.com/chengjiao/hu1pg${i}a2c1111027379515rs%E5%8C%97%E8%A1%97%E5%AE%B6%E5%9B%AD/`);
            }
            break;
        }
        break;

    case 's':
        switch(area) {
        case '50':
            for(let i = 1; i <= 5; i++) {
                urls.push(`http://bj.lianjia.com/chengjiao/pg${i}a1c1111027379442/?sug=%E5%8F%8C%E9%BE%99%E5%8D%97%E9%87%8C`);
            }
            break;
        }
        break;
    }

    console.log('urls:', urls);

    let html_list = [];

    let house_list = [];

    function do_request(url) {
        return new Promise((resolve, reject) => {
            console.log(chalk.green(url));
            request(url, function (error, response, body) {
                if(!error && response.statusCode == 200) {
                    html_list.push(body);
                    resolve();
                } else {
                    reject({
                        error: error
                    });
                }
            });
        });
    }

    co(function *() {
        for(let url of urls) {
            var result =  yield do_request(url);
            //console.log(JSON.stringify(result, null, 2));
            //console.log(result.stdout);
        }
    })
        .then((val) => {
            console.log('Done!', val ? val : '');
            console.log('html_list.length:', html_list.length);

            for(let html of html_list) {
                do_parse_html({
                    html:html,
                    keyword: 'div class="info"',
                    house_list: house_list
                });
            }

            //console.log(JSON.stringify(house_list[0].children, null, 2));
            console.log('house_list.length:', house_list.length);

            let house_object_list = [];
            let house_csv_list = '面积（平米）,单价（元/平米）,成交日期,总价（万）\n';
            for(let house of house_list) {
                let house_object = do_parse_house(house);
                house_object_list.push(house_object);

                if(house_object.area && house_object.price.unit && house_object.deal_date && house_object.price.total) {
                    house_csv_list += `${house_object.area},${house_object.deal_date},${house_object.price.unit},${house_object.price.total}\n`;
                }
            }

            console.log(house_object_list);

            let prefix = `lianjia-${region}-${area}`;

            fs.writeFile(path.resolve(__dirname, `${prefix}-done-${moment().format('YYYYMMDD')}.json`), JSON.stringify(house_object_list, null, 2), {flag: 'w'}, function (err) {
                if(err) {
                    console.error(err);
                } else {
                    console.log('Save success');
                }
            });

            fs.writeFile(path.resolve(__dirname, `${prefix}-done-${moment().format('YYYYMMDD')}.csv`), house_csv_list, {flag: 'w'}, function (err) {
                if(err) {
                    console.error(err);
                } else {
                    console.log('Save success');
                }
            });
        })
        .catch(
            (error) => {
                console.log(error);
                console.log('Failed!');
            }
        );

    function do_parse_house(house) {
        let _house = {};
        _house.price = {};

        for(let e of house.children) {
            if(e.attribs) {
                try {
                    switch(e.attribs.class) {
                    case 'title':
                        _house.title = e.children[0].children[0].raw;
                        _house.area = _house.title.split(' ')[2].replace(/平米/, '');
                        break;

                    case 'address':
                        _house.house_info = e.children[0].children[1].raw;
                        _house.deal_date = e.children[1].children[0].raw;
                        _house.price.total = e.children[2].children[0]
                            && e.children[2].children[0].children[0]
                            && e.children[2].children[0].children[0].raw
                            || 0;
                        break;

                    case 'flood':
                        _house.floor = e.children[0].children[1].raw;
                        _house.price.unit = e.children[2]
                            && e.children[2].children[0]
                            && e.children[2].children[0].children[0]
                            && e.children[2].children[0].children[0].raw
                            || 0;
                        break;
                    }
                } catch(e) {
                    console.log(e);
                }
            }
        }

        return _house;
    }
}

function doing() {
    let urls = [
        'http://bj.lianjia.com/ershoufang/hu1co42rs%E5%8C%97%E8%A1%97%E5%AE%B6%E5%9B%AD/',
        'http://bj.lianjia.com/ershoufang/hu1pg2co42rs%E5%8C%97%E8%A1%97%E5%AE%B6%E5%9B%AD/',
        'http://bj.lianjia.com/ershoufang/hu1pg3co42rs%E5%8C%97%E8%A1%97%E5%AE%B6%E5%9B%AD/'
    ];

    let html_list = [];

    let house_list = [];

    function do_request(url) {
        return new Promise((resolve, reject) => {
            console.log(chalk.green(url));
            request(url, function (error, response, body) {
                if(!error && response.statusCode == 200) {
                    html_list.push(body);
                    resolve();
                } else {
                    reject({
                        error: error
                    });
                }
            });
        });
    }

    co(function *() {
        for(let url of urls) {
            var result =  yield do_request(url);
            //console.log(JSON.stringify(result, null, 2));
            //console.log(result.stdout);
        }
    })
        .then((val) => {
            console.log('Done!', val ? val : '');
            //console.log(html_list);

            for(let html of html_list) {
                do_parse_html(html);
            }

            console.log(JSON.stringify(house_list[0].children, null, 2));
            console.log(house_list.length);

            let house_object_list = [];
            let house_csv_list = '面积（平米）,单价（元/平米）,总价（万）\n';
            for(let house of house_list) {
                let house_object = do_parse_house(house);
                house_object_list.push(house_object);

                house_csv_list += `${house_object.area},${house_object.price.unit},${house_object.price.total}\n`;
            }

            console.log(house_object_list);

            fs.writeFile(path.resolve(__dirname, `lianjia-${moment().format('YYYYMMDD')}.json`), JSON.stringify(house_object_list, null, 2), {flag: 'w'}, function (err) {
                if(err) {
                    console.error(err);
                } else {
                    console.log('Save success');
                }
            });

            fs.writeFile(path.resolve(__dirname, `lianjia-${moment().format('YYYYMMDD')}.csv`), house_csv_list, {flag: 'w'}, function (err) {
                if(err) {
                    console.error(err);
                } else {
                    console.log('Save success');
                }
            });
        })
        .catch(
            (error) => {
                console.log(error);
                console.log('Failed!');
            }
        );

    function do_parse_house(house) {
        let _house = {};
        for(let e of house.children) {
            if(e.attribs) {
                switch(e.attribs.class) {
                case 'title':
                    _house.title = e.children[0].children[0].raw;
                    break;

                case 'address':
                    _house.address = e.children[0].children[1].children[0].raw
                        + e.children[0].children[2].raw;
                    _house.area = _house.address.split(' | ')[2].replace(/平米/, '');
                    break;

                case 'flood':
                    _house.floor = e.children[0].children[1].raw
                        + e.children[0].children[2].children[0].raw;
                    break;

                case 'followInfo':
                    _house.follow_info = e.children[1].raw;
                    break;

                case 'tag':
                    //_house.tag = e.children[0].children[0].raw;
                    break;

                case 'priceInfo':
                    _house.price = {
                        total: e.children[0].children[0].children[0].raw,
                        unit: e.children[1].attribs['data-price']
                    };
                    break;
                }
            }
        }

        return _house;
    }

    function do_parse_html(html) {
        var handler = new htmlparser.DefaultHandler(function (error, dom) {
            if(error){

            } else {
                //console.log('dom:', dom);
            }
        });
        var parser = new htmlparser.Parser(handler);
        parser.parseComplete(html);

        //console.log(handler.dom);

        function get_data(children) {
            for(let e of children) {
                if(e.raw === 'div class="info clear"') {
                    house_list.push(e);
                } else if(e.children){
                    get_data(e.children);
                }
            }
        }

        get_data(handler.dom);
    }
}
