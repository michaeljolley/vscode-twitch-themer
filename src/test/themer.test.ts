// tslint:disable: no-unused-expression

import * as vscode from 'vscode';
import * as chai from 'chai';
import * as sinon from 'sinon';

import ChatClient from '../chat/ChatClient';
import { Themer } from '../commands/Themer';
import { Constants } from '../Constants';

chai.should();

suite('Themer Tests', function () {
  let getConfigurationStub: sinon.SinonStub<any[], vscode.WorkspaceConfiguration>;
  let fakeState: vscode.Memento;
  let fakeWorkspaceConfiguration: vscode.WorkspaceConfiguration;
  let fakeChatClient: ChatClient;
  let fakeThemer: Themer;
  suiteSetup(function(){
    const fakeConfig: {
      [key: string]: any
    } = {
      'workbench.colorTheme': 'Visual Studio Dark'
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
  setup(function () {
    const stateValues: { [key: string]: any } = {
      'bannedUsers': []
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
    fakeChatClient = new ChatClient(fakeState);
    fakeThemer = new Themer(fakeChatClient, fakeState);
    getConfigurationStub.resetHistory();
  });
  suiteTeardown(function () {
    getConfigurationStub.restore();
  });
  test('Themer should return current theme', function (done) {
    let sendMessage = '';

    const sendMessageStub = sinon.stub(fakeChatClient, 'sendMessage').callsFake((message: string) => {
      sendMessage = message;
    });

    fakeThemer.handleCommands(Constants.chatClientUserName, '!theme', '')
      .then(() => {
        try {
          getConfigurationStub.calledOnce.should.be.true;
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

    fakeWorkspaceConfiguration.update('workbench.colorTheme', 'HotDog Stand');

    fakeThemer.resetTheme()
      .then(() => {
        try {
          getConfigurationStub.calledOnce.should.be.true;
          fakeWorkspaceConfiguration.get('workbench.colorTheme')!.should.equal(startupTheme);
          done();
        } catch (error) {
          done(error);
        }
      });
  });
});