'use strict';

// File where the favicon markups are stored
const FAVICON_DATA_FILE = './gulp/config/faviconData.json';

let generateFaviconsTask = function(gulp, config, plugins, wrapFunc) {
  const realFavicon = plugins.realFavicon;
  let func = wrapFunc(function(success, error) {
    realFavicon.generateFavicon({
      masterPicture: config.paths.favicons.masterPicture,
      dest: config.paths.favicons.dest,
      iconsPath: config.paths.favicons.urlPath,
      design: {
        ios: {
          pictureAspect: 'backgroundAndMargin',
          backgroundColor: '#ffffff',
          margin: '28%',
          assets: {
            ios6AndPriorIcons: false,
            ios7AndLaterIcons: false,
            precomposedIcons: false,
            declareOnlyDefaultIcon: true
          }
        },
        desktopBrowser: {},
        windows: {
          pictureAspect: 'noChange',
          backgroundColor: '#2b5797',
          onConflict: 'override',
          assets: {
            windows80Ie10Tile: false,
            windows10Ie11EdgeTiles: {
              small: false,
              medium: true,
              big: false,
              rectangle: false
            }
          }
        },
        androidChrome: {
          pictureAspect: 'shadow',
          themeColor: '#ffffff',
          manifest: {
            name: 'openHAB Vue',
            display: 'standalone',
            orientation: 'notSet',
            onConflict: 'override',
            declared: true
          },
          assets: {
            legacyIcon: false,
            lowResolutionIcons: false
          }
        },
        safariPinnedTab: {
          pictureAspect: 'silhouette',
          themeColor: '#5bbad5'
        }
      },
      settings: {
        scalingAlgorithm: 'Mitchell',
        errorOnImageTooSmall: false,
        readmeFile: false,
        htmlCodeFile: false,
        usePathAsIs: false
      },
      markupFile: FAVICON_DATA_FILE
    }, function() {
      error();
    });
  });

  func.displayName = 'Generating favicons';
  func.description = 'Generating favicons';

  return func;
};

module.exports = generateFaviconsTask;
