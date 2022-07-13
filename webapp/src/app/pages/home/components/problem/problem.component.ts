import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MonacoEditorComponent, MonacoEditorConstructionOptions, MonacoEditorLoaderService } from '@materia-ui/ngx-monaco-editor';
import { NbToastrService } from '@nebular/theme';
import { Store } from '@ngrx/store';
import { filter, Observable, take } from 'rxjs';
import { getProblem } from 'src/actions/problem.action';
import { Info, ProgrammingLanguage } from 'src/models/info.model';
import { Problem } from 'src/models/problem.model';
import { AuthState } from 'src/states/auth.state';
import { InfoState } from 'src/states/info.state';
import { ProblemRetrieval } from 'src/states/problem.state';
import { SubmitState } from 'src/states/submit.state';

import * as SubmitActions from '../../../../../actions/submit.action';

@Component({
  selector: 'app-problem',
  templateUrl: './problem.component.html',
  styleUrls: ['./problem.component.scss']
})
export class ProblemComponent implements OnInit {

  problem$: Observable<ProblemRetrieval>;
  info$: Observable<InfoState>;
  auth$: Observable<AuthState>;
  submit$: Observable<SubmitState>;
  problem?: Problem;
  info?: Info;
  constructor(private store: Store<{ problemRetrieval: ProblemRetrieval, info: InfoState, auth: AuthState, submit: SubmitState }>, private monacoService: MonacoEditorLoaderService, private activatedRoute: ActivatedRoute, private toast: NbToastrService) {
    this.problem$ = this.store.select('problemRetrieval');
    this.info$ = this.store.select('info');
    this.auth$ = this.store.select('auth');
    this.submit$ = this.store.select('submit');
  }

  code: string = 'def test():\tprint("Hello, world")';
  originalCode: string = 'function x() { // TODO }';
  userId: string = '';

  // @ViewChild(MonacoEditorComponent, { static: false })
  // monacoComponent: MonacoEditorComponent;

  editorOptions: MonacoEditorConstructionOptions = {
    theme: 'codeathon-theme',
    language: 'python',
    roundedSelection: true,
    autoIndent: 'full',
    minimap: {
      enabled: true,
      renderCharacters: false
    },
    fontSize: 15,
  };

  selectedLanguageId = 71;

  allowSubmit = false;
  activeMySubmissionTab = false;
  problemId: string = '';

  ngOnInit(): void {
    this.problem$.subscribe(problem => {
      if (problem.success) {
        console.log(problem)
        this.problem = problem.problem;
      }
      else {
        if (problem.error) {
          window.location.href = '/';
        }
      }
    });
    this.activatedRoute.params.subscribe(params => {
      if (params['id'] == undefined) {
        window.location.href = '/';
      }
      this.problemId = params['id'];
      this.store.dispatch(getProblem({ id: params['id'] }));
    });
    this.monacoService.isMonacoLoaded$
      .pipe(
        filter(isLoaded => !!isLoaded),
        take(1)
      )
      .subscribe(() => {
        this.registerMonacoCustomTheme();
      });
    this.info$.subscribe(info => {
      if (info.fetched) {
        this.info = info.info;
      }
    });
    this.auth$.subscribe(auth => {
      if (auth.isLoggedIn) {
        this.allowSubmit = true;
        this.userId = auth.uid;
      }
    });
    this.submit$.subscribe((submit) => {
      this.allowSubmit = !submit.isSubmitting;
      if (submit.error != '') {
        this.toast.danger(submit.error, "Cannot submit your code");
        this.activeMySubmissionTab = false;
      }
      else {
        // this.toast.success("Your code has been submitted", "Success");
        this.activeMySubmissionTab = true;
      }
    });
  }

  registerMonacoCustomTheme() {
    monaco.editor.defineTheme('codeathon-theme', {
      base: 'vs-dark', // can also be vs or hc-black
      inherit: true, // can also be false to completely replace the builtin rules
      rules: [
      ],
      colors: {},

    });
  }

  mergeOptions(partialOptions: any) {
    return {
      ...this.editorOptions,
      ...partialOptions
    };
  }

  changeLanguage() {
    let language = this.info?.programmingLanguages.filter((lang) => lang.id == this.selectedLanguageId)[0];
    let languageName = language?.name.split(' ')[0].toLocaleLowerCase();
    this.editorOptions = this.mergeOptions({ language: languageName });
  }

  submit() {
    this.store.dispatch(SubmitActions.submit({
      submission: {
        problem_id: this.problemId,
        code: this.code,
        language_id: this.selectedLanguageId,
        user_id: this.userId,
        source: this.code,
        evaluated: false,
        score: 0,
        total_memory: 0,
        total_time: 0,
        total_score: 0,
        testcases: []
      }
    }))

  }

  changeTab() {
    this.activeMySubmissionTab = false;
  }

}
