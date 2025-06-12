
import { NextRequest, NextResponse } from 'next/server';
import { mockLogEntries } from '@/lib/data';
import type { LogEntry } from '@/types';
import { startOfDay, endOfDay, isValid, parseISO } from 'date-fns';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');
  const actionParam = searchParams.get('action');
  const userParam = searchParams.get('user');

  let filteredLogs: LogEntry[] = [...mockLogEntries]; // Start with all logs

  // Apply date range filter
  if (startDateParam && endDateParam) {
    try {
      const from = startOfDay(parseISO(startDateParam));
      const to = endOfDay(parseISO(endDateParam));
      if (isValid(from) && isValid(to)) {
        filteredLogs = filteredLogs.filter(log => {
          const logDate = parseISO(log.timestamp);
          return isValid(logDate) && logDate >= from && logDate <= to;
        });
      }
    } catch (e) {
      // console.warn("Invalid date format for date range filter", e);
      // Potentially return a 400 error if strict date validation is required
    }
  } else if (startDateParam) {
    try {
      const from = startOfDay(parseISO(startDateParam));
      if (isValid(from)) {
        filteredLogs = filteredLogs.filter(log => {
          const logDate = parseISO(log.timestamp);
          return isValid(logDate) && logDate >= from;
        });
      }
    } catch (e) {
      // console.warn("Invalid date format for start date filter", e);
    }
  } else if (endDateParam) {
    try {
      const to = endOfDay(parseISO(endDateParam));
      if (isValid(to)) {
        filteredLogs = filteredLogs.filter(log => {
          const logDate = parseISO(log.timestamp);
          return isValid(logDate) && logDate <= to;
        });
      }
    } catch (e) {
      // console.warn("Invalid date format for end date filter", e);
    }
  }

  // Apply action filter
  if (actionParam) {
    filteredLogs = filteredLogs.filter(log => log.action.toLowerCase().includes(actionParam.toLowerCase()));
  }

  // Apply user filter
  if (userParam) {
    filteredLogs = filteredLogs.filter(log => log.user.toLowerCase().includes(userParam.toLowerCase()));
  }

  // Sort logs by timestamp (newest first) - mockLogEntries is already sorted this way usually
  // but good to ensure it here as well if the source wasn't presorted or filtering reordered.
  filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return NextResponse.json(filteredLogs);
}
