/*
 * DataParser Service
 * 负责解析项目数据文件：status.json、tasks、test-results、bugs、reviews
 * 支持 milestone 目录结构（M0/M1/M2...）
 */
const fs = require('fs').promises;
const path = require('path');

class DataParser {

  async getMilestone(projectDir) {
    try {
      const statusPath = path.join(projectDir, 'status.json');
      const content = await fs.readFile(statusPath, 'utf-8');
      const status = JSON.parse(content);
      const milestone = status.milestone || 'M0';
      return milestone.startsWith('M') ? milestone : 'M' + milestone;
    } catch {
      return 'M0';
    }
  }

  async parseStatus(projectDir) {
    const statusPath = path.join(projectDir, 'status.json');
    try {
      const content = await fs.readFile(statusPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      if (error.code === 'ENOENT') return null;
      console.warn('Failed to parse status.json: ' + error.message);
      return null;
    }
  }

  async parseTasks(projectDir) {
    const milestone = await this.getMilestone(projectDir);
    const newDir = path.join(projectDir, 'task', milestone);
    const oldDir = path.join(projectDir, 'tasks');
    const tasksDir = await this._dirExists(newDir) ? newDir : oldDir;

    try {
      const files = await fs.readdir(tasksDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));

      const tasks = [];
      for (const file of jsonFiles) {
        try {
          const content = await fs.readFile(path.join(tasksDir, file), 'utf-8');
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            tasks.push(...parsed);
          } else if (parsed && typeof parsed === 'object') {
            tasks.push(parsed);
          }
        } catch (error) {
          console.warn('Failed to parse task file ' + file + ': ' + error.message);
        }
      }
      return tasks;
    } catch (error) {
      if (error.code === 'ENOENT') return [];
      console.warn('Failed to read tasks directory: ' + error.message);
      return [];
    }
  }

  async parseBugs(projectDir) {
    const milestone = await this.getMilestone(projectDir);
    const newDir = path.join(projectDir, 'bug', milestone);
    const oldDir = path.join(projectDir, 'bugs');

    // 优先新路径：bug/M{ milestone }/*.json
    if (await this._dirExists(newDir)) {
      try {
        const files = await fs.readdir(newDir);
        const bugFiles = files.filter(f => /^BUG-\d+\.json$/i.test(f) || f === 'BLOCKER-023.json');
        const bugs = [];
        for (const file of bugFiles) {
          try {
            const content = await fs.readFile(path.join(newDir, file), 'utf-8');
            const bug = JSON.parse(content);
            bugs.push(this._normalizeBug(bug));
          } catch (error) {
            console.warn('Failed to parse bug file ' + file + ': ' + error.message);
          }
        }
        return bugs.sort((a, b) => a.id.localeCompare(b.id));
      } catch (error) {
        console.warn('Failed to read bug dir: ' + error.message);
      }
    }

    // 降级：旧 bugs/index.json 格式
    try {
      const indexPath = path.join(oldDir, 'index.json');
      const content = await fs.readFile(indexPath, 'utf-8');
      const data = JSON.parse(content);
      return data.bugs || [];
    } catch {}

    return [];
  }

  _normalizeBug(bug) {
    return {
      id: bug.id || bug.bug_id || 'UNKNOWN',
      title: bug.title || '',
      severity: bug.severity || 'major',
      status: this._normalizeBugStatus(bug.status),
      milestone: bug.milestone || 'M0',
      assignee: bug.assignee || null,
      owner: bug.owner || 'QA',
      steps_to_reproduce: Array.isArray(bug.steps_to_reproduce) ? bug.steps_to_reproduce : [],
      expected: bug.expected || '',
      actual: bug.actual || '',
      root_cause: bug.root_cause || null,
      fix: bug.fix || null,
      related_bugs: Array.isArray(bug.related_bugs) ? bug.related_bugs : [],
      verified_at: bug.verified_at || null,
      created_at: bug.created_at || null,
      updated_at: bug.updated_at || null,
      // 兼容旧格式
      description: bug.description || bug.title || '',
      foundAt: bug.created_at ? bug.created_at.split('T')[0] : null,
      fixedAt: bug.fix && bug.fix.fixed_at ? bug.fix.fixed_at.split('T')[0] : null,
    };
  }

  _normalizeBugStatus(status) {
    if (!status) return 'open';
    const s = String(status).toLowerCase();
    if (s === 'fixed') return 'fixed';
    if (s === 'verified') return 'verified';
    if (s === 'in_progress' || s === 'inprogress') return 'in_progress';
    if (s === 'closed' || s === 'wontfix') return 'closed';
    return 'open';
  }

  async parseTestResults(projectDir) {
    const milestone = await this.getMilestone(projectDir);
    const newDir = path.join(projectDir, 'test-result', milestone);
    const oldDirs = [
      path.join(projectDir, 'test-results'),
      path.join(projectDir, 'test-plan'),
    ];

    // 优先新路径：test-result/M{ milestone }/*.json
    if (await this._dirExists(newDir)) {
      try {
        const files = await fs.readdir(newDir);
        const reportFiles = files.filter(f => f.startsWith('TEST-REPORT-') && f.endsWith('.json'));

        if (reportFiles.length > 0) {
          let total = 0, passed = 0, failed = 0, blocked = 0, skipped = 0;
          const reports = [];

          for (const file of reportFiles) {
            try {
              const content = await fs.readFile(path.join(newDir, file), 'utf-8');
              const report = JSON.parse(content);
              reports.push(report);
              total   += report.summary ? (report.summary.total || 0) : 0;
              passed  += report.summary ? (report.summary.passed || 0) : 0;
              failed  += report.summary ? (report.summary.failed || 0) : 0;
              blocked += report.summary ? (report.summary.blocked || 0) : 0;
              skipped += report.summary ? (report.summary.skipped || 0) : 0;
            } catch (error) {
              console.warn('Failed to parse test report ' + file + ': ' + error.message);
            }
          }

          return {
            total, passed, failed, blocked, skipped,
            passRate: total > 0 ? Math.round(passed / total * 100) : 0,
            reports,
          };
        }
      } catch (error) {
        console.warn('Failed to read test-result dir: ' + error.message);
      }
    }

    // 降级：旧 summary.json / index.json
    for (const dir of oldDirs) {
      for (const fname of ['summary.json', 'index.json']) {
        try {
          const content = await fs.readFile(path.join(dir, fname), 'utf-8');
          return JSON.parse(content);
        } catch {}
      }
    }

    return null;
  }

  async parseReviews(projectDir) {
    const milestone = await this.getMilestone(projectDir);
    const newDir = path.join(projectDir, 'review', milestone);
    const oldPath = path.join(projectDir, 'reviews', 'index.json');

    // 优先新路径：review/M{ milestone }/**/*.json（递归扫描）
    if (await this._dirExists(newDir)) {
      try {
        const files = await this._rlistFiles(newDir, '.json');
        const reviews = [];
        for (const file of files) {
          try {
            const content = await fs.readFile(file, 'utf-8');
            const review = JSON.parse(content);
            reviews.push(this._normalizeReview(review));
          } catch (error) {
            console.warn('Failed to parse review ' + file + ': ' + error.message);
          }
        }
        if (reviews.length > 0) return reviews;
      } catch (error) {
        console.warn('Failed to scan review dir: ' + error.message);
      }
    }

    // 降级：旧 reviews/index.json
    try {
      const content = await fs.readFile(oldPath, 'utf-8');
      const data = JSON.parse(content);
      return data.reviews || [];
    } catch {}

    return [];
  }

  _normalizeReview(review) {
    return {
      id: review.id || '',
      owner: review.owner || review.reviewer || '',
      project: review.project || '',
      reviewer: review.reviewer || '',
      date: review.date || '',
      version: review.version || '',
      phase: review.phase || '',
      verdict: review.verdict || 'needs_discussion',
      summary: review.summary || '',
      items: Array.isArray(review.items) ? review.items : [],
      risk_items: Array.isArray(review.risk_items) ? review.risk_items : [],
      recommendations: Array.isArray(review.recommendations) ? review.recommendations : [],
      participants: Array.isArray(review.participants) ? review.participants : [],
      next_action: review.next_action || '',
      updated_at: review.updated_at || null,
    };
  }

  async _rlistFiles(dir, ext) {
    const results = [];
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          const sub = await this._rlistFiles(fullPath, ext);
          results.push(...sub);
        } else if (entry.isFile() && entry.name.endsWith(ext)) {
          results.push(fullPath);
        }
      }
    } catch {}
    return results;
  }

  async _dirExists(dirPath) {
    try {
      const stats = await fs.stat(dirPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }
}

module.exports = DataParser;
