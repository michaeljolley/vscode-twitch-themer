module.exports = {
    branches: ['main'],
    plugins: [
        '@semantic-release/commit-analyzer',
        '@semantic-release/release-notes-generator',
        '@semantic-release/changelog',
        [
            '@semantic-release/npm',
            {
                npmPublish: false,
                tarballDir: 'false',
            },
        ],
        '@semantic-release/git',
        [
            'semantic-release-vsce',
            {
                packageVsix: false,
                publishPackagePath: '*/*.vsix',
            },
        ],
        [
            '@semantic-release/github',
            {
                assets: '*/*.vsix',
            },
        ],
    ],
};