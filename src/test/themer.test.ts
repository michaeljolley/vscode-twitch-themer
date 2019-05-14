// tslint:disable: no-unused-expression

import * as vscode from 'vscode';
import * as chai from 'chai';
import * as sinon from 'sinon';

import ChatClient from '../chat/ChatClient';
import { Themer } from '../commands/Themer';
import { Constants } from '../Constants';

chai.should();

suite('Themer Tests', function () {
  let fakeState: vscode.Memento;
  let fakeWorkspaceConfiguration: vscode.WorkspaceConfiguration;
  let getConfigurationStub: sinon.SinonStub<any[], vscode.WorkspaceConfiguration>;
  setup(function () {
    const stateValues: { [key: string]: any } = {
      'bannedUsers': []
    };
    const fakeConfig: {
      [key: string]: any
    } = {
      'workbench.colorTheme': 'Visual Studio Dark'
    };
    fakeState = {
      get(key: string): any {
        return stateValues[key];
      },
      update(key: string, value: any) {
        stateValues[key] = value;
        return Promise.resolve();
      }
    };
    fakeWorkspaceConfiguration = {
      get(section: string) {
        return fakeConfig[section];
      },
      has(section: string) {
        return Object.keys(fakeConfig).some(c => c === section);
      },
      inspect(section: string) {
        return undefined;
      },
      update(section: string, value: any, configurationTarget?: vscode.ConfigurationTarget | boolean) {
        fakeConfig[section] = value;
        return Promise.resolve();
      }
    };
    getConfigurationStub = sinon.stub(vscode.workspace, 'getConfiguration').returns(fakeWorkspaceConfiguration);
  });
  teardown(function () {
    getConfigurationStub.restore();
  });
  test('Themer should return current theme', function (done) {
    const chatClient = new ChatClient(fakeState);
    const themer = new Themer(chatClient, fakeState);
    let sendMessage = '';

    const sendMessageStub = sinon.stub(chatClient, 'sendMessage').callsFake((message: string) => {
      sendMessage = message;
    });

    themer.handleCommands(Constants.chatClientUserName, '!theme', '')
      .then(() => {
        try {
          // getConfigurationStub.calledOnce.should.be.true;
          sendMessageStub.calledOnce.should.be.true;
          sendMessage.should.equal(`The current theme is Visual Studio Dark`);
          done();
        }
        catch (error) {
          done(error);
        }
      });
  });

  test('Themer should reset theme to theme used when extension is activated', function (done) {
    const startupTheme = fakeWorkspaceConfiguration.get('workbench.colorTheme');
    const chatClient = new ChatClient(fakeState);
    const themer = new Themer(chatClient, fakeState);

    fakeWorkspaceConfiguration.update('workbench.colorTheme', 'HotDog Stand');

    themer.resetTheme()
      .then(() => {
        try {
          // getConfigurationStub.calledOnce.should.be.true;
          fakeWorkspaceConfiguration.get('workbench.colorTheme')!.should.equal(startupTheme);
          done();
        } catch (error) {
          done(error);
        }
      });
  });
});