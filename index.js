'use strict';

module.exports = linkify;

var _ = require('lodash'),
    punycode = require('punycode');

var enabled = {
    hashtags: true,
    symbols: false,
    user_mentions: true,
    urls: true,
    media: true
};

function linkify(tweet) {
    tweet = tweet.retweeted_status || tweet;

    var chars = punycode.ucs2.decode(tweet.text);
    var parts = [];
    var idx = 0;

    var links = _(tweet.entities)
        .map(function (section, type) {
            if (!enabled[type])
                return [];

            return _.map(section, function (entity) {
                return {
                    start: entity.indices[0],
                    end: entity.indices[1],
                    href: buildUrl(type, entity),
                    display: entity.display_url
                };
            });
        })
        .flatten()
        .sortBy('start')
        .each(function (link) {
            parts.push(chars.slice(idx, link.start));
            parts.push(wrap(chars, link));
            idx = link.end;
        });

    return punycode.ucs2.encode(_.flattenDeep(parts));
}

function buildUrl(type, entity) {
    if (type == 'user_mentions')
        return 'https://twitter.com/' + entity.screen_name;

    if (type == 'hashtags')
        return 'https://twitter.com/hashtag/' + entity.text;

    return entity.url;
}

function wrap(chars, link) {
    var pre = punycode.ucs2.decode('<a href="' + link.href + '">');
    var post = punycode.ucs2.decode('</a>');

    var mid = link.display
        ? punycode.ucs2.decode(link.display)
        : chars.slice(link.start, link.end);

    return [pre, mid, post];
}
