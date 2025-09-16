import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, Trophy, Medal, Award, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { HanoiRecord } from '@shared/schema';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

type SortField = 'moves' | 'seconds' | 'disks' | 'createdAt' | 'studentName';
type SortDirection = 'asc' | 'desc';

interface SortState {
  field: SortField;
  direction: SortDirection;
}

export default function LeaderboardPage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [diskFilter, setDiskFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortState, setSortState] = useState<SortState>({ field: 'moves', direction: 'asc' });
  
  const recordsPerPage = 10;

  // Fetch all records
  const { data: allRecords = [], isLoading, error } = useQuery<HanoiRecord[]>({
    queryKey: ['/api/records'],
    enabled: true,
  });

  // Calculate optimal records per disk count
  const optimalRecords = useMemo(() => {
    const optimal: Record<number, HanoiRecord> = {};
    allRecords.forEach(record => {
      const current = optimal[record.disks];
      if (!current || record.moves < current.moves || 
          (record.moves === current.moves && record.seconds < current.seconds)) {
        optimal[record.disks] = record;
      }
    });
    return optimal;
  }, [allRecords]);

  // Filter and sort records
  const filteredAndSortedRecords = useMemo(() => {
    let filtered = allRecords;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(record =>
        record.studentId.includes(searchQuery.trim()) ||
        record.studentName.toLowerCase().includes(searchQuery.trim().toLowerCase())
      );
    }

    // Apply disk count filter
    if (diskFilter !== 'all') {
      filtered = filtered.filter(record => record.disks === parseInt(diskFilter));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const { field, direction } = sortState;
      let aValue: any = a[field];
      let bValue: any = b[field];

      if (field === 'createdAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [allRecords, searchQuery, diskFilter, sortState]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedRecords.length / recordsPerPage);
  const paginatedRecords = filteredAndSortedRecords.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  const handleSort = (field: SortField) => {
    setSortState(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1);
  };

  const getSortIcon = (field: SortField) => {
    if (sortState.field !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortState.direction === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  const isOptimalRecord = (record: HanoiRecord): boolean => {
    return optimalRecords[record.disks]?.id === record.id;
  };

  const calculateMinMoves = (disks: number): number => {
    return Math.pow(2, disks) - 1;
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (index === 1) return <Medal className="h-4 w-4 text-gray-400" />;
    if (index === 2) return <Award className="h-4 w-4 text-amber-600" />;
    return null;
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p data-testid="text-loading">기록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-destructive mb-4" data-testid="text-error">
              기록을 불러오는데 실패했습니다.
            </p>
            <Button onClick={() => window.location.reload()} data-testid="button-retry">
              다시 시도
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setLocation('/')}
              data-testid="button-back-home"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
                <Trophy className="h-8 w-8 text-yellow-500" />
                명예의 전당
              </h1>
              <p className="text-muted-foreground" data-testid="text-page-subtitle">
                하노이타워 게임 기록
              </p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle data-testid="text-filters-title">필터 및 검색</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="학번 또는 이름으로 검색"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>

              {/* Disk Filter */}
              <Select
                value={diskFilter}
                onValueChange={(value) => {
                  setDiskFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger data-testid="select-disk-filter">
                  <SelectValue placeholder="원판 수 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 원판 수</SelectItem>
                  {[3, 4, 5, 6, 7, 8, 9, 10].map(count => (
                    <SelectItem key={count} value={count.toString()}>
                      {count}개 원판
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Results count */}
              <div className="flex items-center text-sm text-muted-foreground">
                <span data-testid="text-results-count">
                  총 {filteredAndSortedRecords.length}개 기록
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Records Table */}
        <Card>
          <CardHeader>
            <CardTitle data-testid="text-records-title">게임 기록</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16" data-testid="header-rank">순위</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('studentName')}
                        className="h-auto p-0 font-semibold"
                        data-testid="button-sort-name"
                      >
                        학생 정보 {getSortIcon('studentName')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('disks')}
                        className="h-auto p-0 font-semibold"
                        data-testid="button-sort-disks"
                      >
                        원판 수 {getSortIcon('disks')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('moves')}
                        className="h-auto p-0 font-semibold"
                        data-testid="button-sort-moves"
                      >
                        이동 횟수 {getSortIcon('moves')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('seconds')}
                        className="h-auto p-0 font-semibold"
                        data-testid="button-sort-time"
                      >
                        시간 {getSortIcon('seconds')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('createdAt')}
                        className="h-auto p-0 font-semibold"
                        data-testid="button-sort-date"
                      >
                        날짜 {getSortIcon('createdAt')}
                      </Button>
                    </TableHead>
                    <TableHead className="w-20" data-testid="header-status">상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <p className="text-muted-foreground" data-testid="text-no-records">
                          조건에 맞는 기록이 없습니다.
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedRecords.map((record, index) => {
                      const globalIndex = (currentPage - 1) * recordsPerPage + index;
                      const isOptimal = isOptimalRecord(record);
                      const minMoves = calculateMinMoves(record.disks);
                      const isMinMoves = record.moves === minMoves;

                      return (
                        <TableRow
                          key={record.id}
                          className={isOptimal ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}
                          data-testid={`row-record-${record.id}`}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {getRankIcon(globalIndex)}
                              <span data-testid={`text-rank-${globalIndex + 1}`}>
                                {globalIndex + 1}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium" data-testid={`text-student-name-${record.id}`}>
                                {record.studentName}
                              </div>
                              <div className="text-sm text-muted-foreground" data-testid={`text-student-id-${record.id}`}>
                                {record.studentId}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" data-testid={`badge-disks-${record.id}`}>
                              {record.disks}개
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span
                                className={isMinMoves ? 'font-bold text-green-600' : ''}
                                data-testid={`text-moves-${record.id}`}
                              >
                                {record.moves}
                              </span>
                              {isMinMoves && (
                                <Badge variant="secondary" className="text-xs">
                                  최적
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell data-testid={`text-time-${record.id}`}>
                            {formatTime(record.seconds)}
                          </TableCell>
                          <TableCell className="text-sm" data-testid={`text-date-${record.id}`}>
                            {format(new Date(record.createdAt), 'MM/dd HH:mm', { locale: ko })}
                          </TableCell>
                          <TableCell>
                            {isOptimal && (
                              <Badge className="bg-yellow-500 hover:bg-yellow-600">
                                <Trophy className="h-3 w-3 mr-1" />
                                최고
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground" data-testid="text-pagination-info">
                    {((currentPage - 1) * recordsPerPage) + 1}-{Math.min(currentPage * recordsPerPage, filteredAndSortedRecords.length)} / {filteredAndSortedRecords.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      data-testid="button-prev-page"
                    >
                      이전
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            data-testid={`button-page-${pageNum}`}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      data-testid="button-next-page"
                    >
                      다음
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Statistics */}
        {filteredAndSortedRecords.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium" data-testid="text-total-records">
                  총 기록 수
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-count">
                  {filteredAndSortedRecords.length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium" data-testid="text-avg-moves">
                  평균 이동 횟수
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-avg-moves-value">
                  {Math.round(filteredAndSortedRecords.reduce((sum, record) => sum + record.moves, 0) / filteredAndSortedRecords.length)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium" data-testid="text-avg-time">
                  평균 완료 시간
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-avg-time-value">
                  {formatTime(Math.round(filteredAndSortedRecords.reduce((sum, record) => sum + record.seconds, 0) / filteredAndSortedRecords.length))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}